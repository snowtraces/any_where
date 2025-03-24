package handlers

import (
	"fmt"
	"snowtraces.com/any_where/utils"
	"strconv"
	"strings"
)

var fileIdxMap = make(map[string]string)
var LastFileIdx = []int64{0, -1}

func WriteToFile(id string, data []byte) {
	// 1. 块文件
	fileIdx := LastFileIdx[0]
	cursor := LastFileIdx[1]

	// 判断文件是否超过1M，超过文件索引增长+1
	if cursor+int64(len(data)) > 1024*1024 {
		LastFileIdx[0]++
		LastFileIdx[1] = -1
		fileIdx = LastFileIdx[0]
		cursor = LastFileIdx[1]
	}

	blockName := "block_" + strconv.FormatInt(fileIdx, 10)
	err := utils.Manager.WriteAt(blockName, data, cursor+1)
	if err != nil {
		fmt.Println("写入失败:", err)
		return
	}

	// 2. 索引文件
	cursorEnd := cursor + 1 + int64(len(data))
	updateIdx(id, fileIdx, cursor+1, cursorEnd)
	LastFileIdx[0] = fileIdx
	LastFileIdx[1] = cursorEnd - 1
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
	bytes, err := utils.Manager.ReadAt(blockName, start, int(end-start))
	if err != nil {
		fmt.Println("读取文件失败:", err)
		return nil
	}
	return bytes
}

func InitFileIdx() {
	content, err := utils.Manager.Read("block_idx")
	if err != nil {
		panic(err)
	}

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

func updateIdx(id string, fileIdx int64, start int64, end int64) {
	idx := strconv.FormatInt(fileIdx, 10) + ":" + strconv.FormatInt(start, 10) + ":" + strconv.FormatInt(end, 10)
	// 1. 写内存
	fileIdxMap[id] = idx

	// 2. 写文件
	idx = id + ":" + idx
	utils.Manager.WriteAt("block_idx", []byte(idx+"\n"), -1)
}
