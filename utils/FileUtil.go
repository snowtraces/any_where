package utils

import (
	"fmt"
	"io/ioutil"
	"os"
	"sync"
	"time"
)

var Manager *FileManager

func init() {
	Manager = NewFileManager()
}

type FileHandler struct {
	file       *os.File
	lastAccess time.Time
	mutex      sync.Mutex
	quit       chan struct{}
}

type FileManager struct {
	files map[string]*FileHandler
	mutex sync.Mutex
}

// NewFileManager 创建多文件管理器
func NewFileManager() *FileManager {
	return &FileManager{
		files: make(map[string]*FileHandler),
	}
}

// openOrCreateFile 打开或创建文件
func (fm *FileManager) openOrCreateFile(path string, appendFlag bool) (*FileHandler, error) {
	fm.mutex.Lock()
	defer fm.mutex.Unlock()

	if handler, exists := fm.files[path]; exists {
		return handler, nil
	}
	var file *os.File
	var err error
	if appendFlag {
		file, err = os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0644)
	} else {
		file, err = os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0644)
	}

	if err != nil {
		return nil, fmt.Errorf("无法打开文件: %v", err)
	}

	handler := &FileHandler{
		file:       file,
		lastAccess: time.Now(),
		quit:       make(chan struct{}),
	}

	fm.files[path] = handler

	// 启动自动释放机制
	go handler.autoRelease(path, fm, 1*time.Minute)

	return handler, nil
}

// autoRelease 文件自动释放
func (fh *FileHandler) autoRelease(path string, fm *FileManager, timeout time.Duration) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			fh.mutex.Lock()
			if time.Since(fh.lastAccess) > timeout {
				fmt.Println("自动释放文件:", path)
				fh.file.Close()
				fm.mutex.Lock()
				delete(fm.files, path) // 从管理器中移除
				fm.mutex.Unlock()
				fh.mutex.Unlock()
				return
			}
			fh.mutex.Unlock()
		case <-fh.quit:
			return
		}
	}
}

// Write 写入文件内容
func (fm *FileManager) WriteAt(path string, data []byte, offset int64) error {
	handler, err := fm.openOrCreateFile(path, offset == -1)
	if err != nil {
		return err
	}

	handler.mutex.Lock()
	defer handler.mutex.Unlock()

	if offset != -1 {
		handler.file.Seek(offset, 0)
	}

	if _, err := handler.file.Write(data); err != nil {
		return fmt.Errorf("写入失败: %v", err)
	}
	handler.lastAccess = time.Now()
	return nil
}

// ReadAt 从指定位置读取文件内容
func (fm *FileManager) ReadAt(path string, offset int64, size int) ([]byte, error) {
	fmt.Println("ReadAt", offset, size)
	handler, err := fm.openOrCreateFile(path, false)
	if err != nil {
		return nil, err
	}

	//handler.mutex.Lock()
	//defer handler.mutex.Unlock()

	buffer := make([]byte, size)
	_, err = handler.file.Seek(offset, 0)
	if err != nil {
		return nil, fmt.Errorf("Seek失败: %v", err)
	}

	n, err := handler.file.Read(buffer)
	if err != nil {
		return nil, fmt.Errorf("读取失败: %v", err)
	}

	handler.lastAccess = time.Now()
	return buffer[:n], nil
}
func (fm *FileManager) Read(path string) ([]byte, error) {
	handler, err := fm.openOrCreateFile(path, false)
	if err != nil {
		return nil, err
	}

	all, err := ioutil.ReadAll(handler.file)

	if err != nil {
		return nil, fmt.Errorf("读取失败: %v", err)
	}

	handler.lastAccess = time.Now()
	return all, nil
}

// ReleaseAll 手动释放所有文件
func (fm *FileManager) ReleaseAll() {
	fm.mutex.Lock()
	defer fm.mutex.Unlock()

	for path, handler := range fm.files {
		close(handler.quit)
		handler.file.Close()
		delete(fm.files, path)
		fmt.Println("手动释放文件:", path)
	}
}
