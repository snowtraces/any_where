package routes

import (
	"net/http"
	"snowtraces.com/any_where/handlers"
)

// WebRoute 定义一个 WebRoute 结构体用于存放单个路由
type WebRoute struct {
	Name        string
	Method      string
	Pattern     string
	HandlerFunc http.HandlerFunc
}

// WebRoutes 声明 WebRoutes 切片存放所有 Web 路由
type WebRoutes []WebRoute

// 定义所有 Web 路由
var webRoutes = WebRoutes{
	//WebRoute{
	//	"Home",
	//	"GET",
	//	"/",
	//	handlers.Home,
	//},
	WebRoute{
		"SaveMsg",
		"POST",
		"/api/v1/msg/save",
		handlers.SaveMsg,
	},
	WebRoute{
		"LoadMsg",
		"GET",
		"/api/v1/msg/load",
		handlers.LoadMsg,
	},
	WebRoute{
		"ApiError",
		"GET",
		"/error",
		handlers.Error,
	},
}
