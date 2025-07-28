package handlers

import (
	"encoding/json"
	"fmt"
	"io"
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
	body := make([]byte, contentLength)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		Fail(w, r, "读取请求失败: "+err.Error())
		return
	}
	defer r.Body.Close()

	// 对读取的 JSON 数据进行解析
	msg := Msg{}
	err = json.Unmarshal(body, &msg)
	if err != nil {
		Fail(w, r, "解析失败"+err.Error())
		return
	}

	id := idWorker(8)
	msg.CreateAt = time.Now().Unix()
	msg.Id = id

	jsonBytes, _ := json.Marshal(&msg)
	err = WriteToFile(id, jsonBytes)
	if err != nil {
		Fail(w, r, "写入失败"+err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Write(jsonBytes)
}

func LoadMsg(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()
	id := values.Get("id")

	file, err := ReadFromFile(id)
	if err != nil {
		FailWithStatusCode(w, r, http.StatusNotFound, "msg not found")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Write(file)
}

func Error(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(401)
	fmt.Fprintln(w, "认证后才能访问该接口")
}

func Fail(w http.ResponseWriter, r *http.Request, err string) {
	w.WriteHeader(500)
	fmt.Fprintln(w, err)
}

func FailWithStatusCode(w http.ResponseWriter, r *http.Request, statusCode int, err string) {
	w.WriteHeader(statusCode)
	fmt.Fprintln(w, err)
}

func idWorker(len int) string {
	var id []byte

	rand.Seed(time.Now().UnixNano())
	for i := 0; i < len; i++ {
		id = append(id, RandAlphaNumber[(rand.Intn(35)+1)])
	}

	return string(id)
}
