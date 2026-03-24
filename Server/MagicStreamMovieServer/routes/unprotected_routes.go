package routes

import (
	"github.com/gin-gonic/gin"
	controller "github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/controllers"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func SetupUnprotectedRoutes(router *gin.Engine, client *mongo.Client) {
	router.POST("/register", controller.RegisterUser(client))
	router.POST("/login", controller.LoginUser(client))
	router.GET("/movies", controller.GetMovies(client))
	router.GET("/genres", controller.GetGenres(client))
}
