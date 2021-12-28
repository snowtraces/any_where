package handlers

import (
	"encoding/json"
	"net/http"
)

type Greeting struct {
	Message string `json:"message"`
}

func Home(w http.ResponseWriter, r *http.Request) {
	// 返回文本字符串
	//w.Write([]byte("欢迎访问学院君个人网站?"));
	// 返回 HTML 文档
	/*html := `<html>
	      <head>
	          <title>学院君个人网站</title>
	      </head>
	      <body>
	          <h1>欢迎访问学院君个人网站?</h1>
	      </body>
	  </html>`
	  w.Write([]byte(html))*/
	// 返回 JSON 格式数据
	greeting := Greeting{
		"欢迎访问学院君个人网站?",
	}
	message, _ := json.Marshal(greeting)
	w.Header().Set("Content-Type", "application/json")
	w.Write(message)
}
