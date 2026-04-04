package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/database"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/routes"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("Warning: unable to find .env file")
	}

	// 支持通过环境变量设置 GIN_MODE（release|debug|test），默认为 debug
	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	router := gin.Default()

	allowOrigins := []string{"http://localhost:5173"}
	if v := os.Getenv("ALLOW_ORIGINS"); v != "" {
		parts := strings.Split(v, ",")
		tmp := make([]string, 0, len(parts))
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				tmp = append(tmp, p)
			}
		}
		if len(tmp) > 0 {
			allowOrigins = tmp
		}
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           time.Hour * 12,
	}))

	// 在非 release 模式下使用 gin.Logger；生产环境可使用更完善的日志方案
	if gin.Mode() != gin.ReleaseMode {
		router.Use(gin.Logger())
	}

	var client *mongo.Client = database.Connect()
	if err := client.Ping(context.Background(), nil); err != nil {
		log.Fatalf("Failed to reach server: %v", err)
	}

	defer func() {
		err := client.Disconnect(context.Background())
		if err != nil {
			log.Fatalf("Failed to disconnect from MongoDB: %v", err)
		}
	}()

	routes.SetupUnprotectedRoutes(router, client)
	routes.SetupProtectedRoutes(router, client)

	// 为每个http请求启动一个新的goroutine
	if err := router.Run(":8080"); err != nil {
		fmt.Println("Failed to start server", err)
	}
}
