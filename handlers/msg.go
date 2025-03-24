package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"
)

var MsgById = make(map[string]*Msg)
var RandAlphaNumber = []byte("0123456789abcdefghijklmnopqrstuvwxyz")

type Msg struct {
	Content  string `json:"content"`
	CreateAt int64  `json:"createAt"`
	Id       string `json:"id"`
}

type ApiResult struct {
	Msg  string `json:"msg"`
	Code int    `json:"code"`
	Data string `json:"data"`
}

func SaveMsg(w http.ResponseWriter, r *http.Request) {
	// 读取请求
	contentLength := r.ContentLength
	log.Println(contentLength)

	body := make([]byte, contentLength)
	r.Body.Read(body)
	//body = bytes.ReplaceAll(body, []byte("\x00"), []byte(""))

	// 对读取的 JSON 数据进行解析
	msg := Msg{}
	err := json.Unmarshal(body, &msg)
	if err != nil {
		log.Println(err)
		return
	}

	id := idWorker(8)
	msg.CreateAt = time.Now().Unix()
	msg.Id = id

	//MsgById[id] = &msg

	jsonBytes, _ := json.Marshal(&msg)
	WriteToFile(id, jsonBytes)

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Write(jsonBytes)
}

func LoadMsg(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	id := values.Get("id")

	//value := MsgById[id]
	//jsonBytes, _ := json.Marshal(file)
	file := ReadFromFile(id)

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Write(file)
}

func Error(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(401)
	fmt.Fprintln(w, "认证后才能访问该接口")
}

func idWorker(len int) string {
	var id []byte

	rand.Seed(time.Now().UnixNano())
	for i := 0; i < len; i++ {
		id = append(id, RandAlphaNumber[(rand.Intn(35)+1)])
	}

	return string(id)
}
