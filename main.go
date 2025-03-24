package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"snowtraces.com/any_where/handlers"
	"time"

	. "snowtraces.com/any_where/routes"
	. "snowtraces.com/any_where/utils"
)

var manager *FileManager

type spaHandler struct {
	staticPath string
	indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path, err := filepath.Abs(r.URL.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	path = filepath.Join(h.staticPath, r.URL.Path)

	_, err = os.Stat(path)
	if os.IsNotExist(err) {
		http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.FileServer(http.Dir(h.staticPath)).ServeHTTP(w, r)
}

func main() {

	handlers.InitFileIdx()
	defer Manager.ReleaseAll()

	router := NewRouter()

	spa := spaHandler{staticPath: "./static", indexPath: "index.html"}
	router.PathPrefix("/").Handler(spa)

	svr := &http.Server{
		Handler:      router,
		Addr:         ":8080",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Println("Starting HTTP service at " + svr.Addr)

	log.Fatal(svr.ListenAndServe())
}
