package controllers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/database"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/models"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/utils"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	hashPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashPassword), nil
}

func RegisterUser(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var user models.User

		if err := c.ShouldBindJSON(&user); err != nil {
			log.Printf("[RegisterUser] invalid request body: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data"})
			return
		}

		validate := validator.New()
		if err := validate.Struct(user); err != nil {
			log.Printf("[RegisterUser] validation failed for email=%s: %v", user.Email, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
			return
		}

		hashedPassword, err := HashPassword(user.Password)
		if err != nil {
			log.Printf("[RegisterUser] hash password failed for email=%s: %v", user.Email, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.Password = hashedPassword

		ctx, cancel := context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()

		var userCollection *mongo.Collection = database.OpenCollection("users", client)

		// 检查电子邮件是否已存在
		count, err := userCollection.CountDocuments(ctx, bson.M{"email": user.Email})
		if err != nil {
			log.Printf("[RegisterUser] count existing user failed for email=%s: %v", user.Email, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing user"})
			return
		}

		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
			return
		}
		user.UserId = bson.NewObjectID().Hex()
		user.CreatedAt = time.Now()
		user.UpdatedAt = time.Now()

		result, err := userCollection.InsertOne(ctx, user)

		if err != nil {
			log.Printf("[RegisterUser] insert user failed for email=%s: %v", user.Email, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "data": result})
	}
}

func LoginUser(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var userLogin models.UserLogin

		if err := c.ShouldBindJSON(&userLogin); err != nil {
			log.Printf("[LoginUser] invalid request body: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalide input data"})
			return
		}

		var ctx, cancel = context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()

		var userCollection *mongo.Collection = database.OpenCollection("users", client)

		var foundUser models.User
		err := userCollection.FindOne(ctx, bson.M{"email": userLogin.Email}).Decode(&foundUser)
		if err != nil { // 用户未找到
			log.Printf("[LoginUser] find user failed for email=%s: %v", userLogin.Email, err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(foundUser.Password), []byte(userLogin.Password))
		if err != nil { // 密码不匹配
			log.Printf("[LoginUser] password mismatch for email=%s", userLogin.Email)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		token, refreshToken, err := utils.GenerateAllTokens(foundUser.Email, foundUser.FirstName, foundUser.LastName, foundUser.Role, foundUser.UserId)
		if err != nil {
			log.Printf("[LoginUser] generate tokens failed for user_id=%s: %v", foundUser.UserId, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
			return
		}
		err = utils.UpdateAllTokens(foundUser.UserId, token, refreshToken, client, c)
		if err != nil {
			log.Printf("[LoginUser] update tokens failed for user_id=%s: %v", foundUser.UserId, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tokens"})
			return
		}
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "access_token",
			Value:    token,
			Path:     "/",
			MaxAge:   86400, // 1天时间
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteNoneMode,
		})
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "refresh_token",
			Value:    refreshToken,
			Path:     "/",
			MaxAge:   86400, // 1天时间
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteNoneMode,
		})
		c.JSON(http.StatusOK, models.UserResponse{
			UserId:    foundUser.UserId,
			FirstName: foundUser.FirstName,
			LastName:  foundUser.LastName,
			Email:     foundUser.Email,
			Role:      foundUser.Role,
			// Token:           token,
			// RefreshToken:    refreshToken,
			FavouriteGenres: foundUser.FavouriteGenres,
		})
	}
}

func LogoutUser(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var UserLogout struct {
			UserId string `json:"user_id"`
		}
		err := c.ShouldBindJSON(&UserLogout)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}
		fmt.Println("User ID from Logout request:", UserLogout.UserId)

		err = utils.UpdateAllTokens(UserLogout.UserId, "", "", client, c)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error logging out"})
			return
		}
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "access_token",
			Value:    "",
			Path:     "/",
			MaxAge:   1,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteNoneMode,
		})

		c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
	}
}
