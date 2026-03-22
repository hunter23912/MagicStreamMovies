package routes

import (
	"github.com/gin-gonic/gin"
	controller "github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/controllers"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/middleware"
)

func SetupProtectedRoutes(router *gin.Engine) {
	router.Use(middleware.AuthMiddleWare())
	router.GET("/movie/:imdb_id", controller.GetMovie())
	router.POST("/addmovie", controller.AddMovie())
	router.GET("/recommendedmovies", controller.GetRecommendedMovies())
	router.PATCH("/updatereview/:imdb_id", controller.AdminReviewUpdate())
}
