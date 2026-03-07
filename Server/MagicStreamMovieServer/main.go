package main

import (
	"fmt"

	"github.com/gin-gonic/gin"

	controller "MagicStreamMovieServer/controllers"
)

func main() {
	router := gin.Default()

	router.LoadHTMLGlob("templates/*.html")

	router.GET("/movies", controller.GetMovies())

	if err := router.Run("localhost:8080"); err != nil {
		fmt.Println("Failed to start server", err)
	}
}
