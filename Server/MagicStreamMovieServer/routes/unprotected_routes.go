package routes

import (
	"github.com/gin-gonic/gin"
	controller "github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/controllers"
)

func SetupUnprotectedRoutes(router *gin.Engine) {
	router.POST("/register", controller.RegisterUser())
	router.POST("/login", controller.LoginUser())
	router.GET("/movies", controller.GetMovies())
}
