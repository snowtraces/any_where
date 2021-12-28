package handlers

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"strconv"
	"strings"
	"sync"
)

var mutex sync.Mutex
var fileIdxMap = make(map[string]string)
var LastFileIdx = []int64{0, -1}

func WriteToFile(id string, data []byte) {
	mutex.Lock()

	// 1. 块文件
	fileIdx := LastFileIdx[0]
	cursor := LastFileIdx[1]

	blockName := "block_" + strconv.FormatInt(fileIdx, 10)
	if cursor == -1 {
		// 创建文件快
		createBlock(blockName)
	}

	writeFile(blockName, data)

	// 2. 索引文件
	cursorEnd := cursor + 1 + int64(len(data))
	updateIdx(id, fileIdx, cursor+1, cursorEnd)
	LastFileIdx[0] = fileIdx
	LastFileIdx[1] = cursorEnd - 1

	mutex.Unlock()
}

func ReadFromFile(id string) []byte {
	// 1. 索引读取
	fileIdxString := fileIdxMap[id]
	fileMeta := strings.Split(fileIdxString, ":")
	fileIdx, _ := strconv.ParseInt(fileMeta[0], 10, 32)
	start, _ := strconv.ParseInt(fileMeta[1], 10, 32)
	end, _ := strconv.ParseInt(fileMeta[2], 10, 32)

	// 2. 读取文件
	blockName := "block_" + strconv.FormatInt(fileIdx, 10)
	return readFile(blockName, start, end)
}

func InitFileIdx() {
	file, err := os.Open("./block_idx")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	content, err := ioutil.ReadAll(file)
	idxLines := strings.Split(string(content), "\n")
	for i := range idxLines {
		line := idxLines[i]
		splitIdx := strings.Index(line, ":")
		if splitIdx != -1 {
			fileIdxMap[line[:splitIdx]] = line[splitIdx+1:]
			if i == len(idxLines)-2 {
				fileEndIdx, _ := strconv.ParseInt(line[strings.LastIndex(line, ":")+1:], 10, 32)
				LastFileIdx[1] = fileEndIdx - 1
			}
		}
	}

}

func createBlock(blockName string) {
	file, err := os.Create(blockName)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer file.Close()
}

func writeFile(blockName string, data []byte) {

	file, _ := os.OpenFile(blockName, os.O_APPEND|os.O_WRONLY, os.ModeAppend)

	var buf bytes.Buffer
	binary.Write(&buf, binary.LittleEndian, data)
	file.Write(buf.Bytes())
}

func readFile(blockName string, start int64, end int64) []byte {
	file, err := os.OpenFile(blockName, os.O_APPEND, 0666)
	if err != nil {
		fmt.Println(err)
	}

	size := end - start
	buff := make([]byte, size)

	file.Seek(start, io.SeekStart)
	for {
		lens, err := file.Read(buff)
		if err == io.EOF || lens < 0 || lens == int(size) {
			break
		}
	}

	defer file.Close()
	return buff
}

func updateIdx(id string, fileIdx int64, start int64, end int64) {
	idx := strconv.FormatInt(fileIdx, 10) + ":" + strconv.FormatInt(start, 10) + ":" + strconv.FormatInt(end, 10)
	// 1. 写内存
	fileIdxMap[id] = idx

	// 2. 写文件
	f, err := os.OpenFile("./block_idx", os.O_APPEND, 0666)
	if err != nil {
		log.Println(err.Error())
	}

	idx = id + ":" + idx
	_, err = f.Write([]byte(idx + "\n"))
	if err != nil {
		log.Println(err.Error())
	}
	f.Close()
}
