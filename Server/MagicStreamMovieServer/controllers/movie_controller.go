package controllers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func GetMovies() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "List of movies"})
	}
}
