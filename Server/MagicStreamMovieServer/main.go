package main

import (
	"fmt"

	"github.com/gin-gonic/gin"

	controller "github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/controllers"
)

func main() {
	router := gin.Default()

	router.GET("/movies", controller.GetMovies())
	router.GET("/movie/:imdb_id", controller.GetMovie())
	router.POST("/addmovie", controller.AddMovie())

	// 为每个http请求启动一个新的goroutine
	if err := router.Run("localhost:8080"); err != nil {
		fmt.Println("Failed to start server", err)
	}
}
