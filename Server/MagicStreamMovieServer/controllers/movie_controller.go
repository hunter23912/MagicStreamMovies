package controllers

import (
	"context"
	"errors"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/database"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/models"
	"github.com/hunter23912/MagicStreamMovies/Server/MagicStreamMovieServer/utils"
	"github.com/joho/godotenv"
	"github.com/tmc/langchaingo/llms/openai"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"net/http"
	"time"
)

var validate = validator.New()

func GetMovies(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()

		var movieCollection *mongo.Collection = database.OpenCollection("movies", client)

		var movies []models.Movie
		cursor, err := movieCollection.Find(ctx, bson.M{})

		if err != nil {
			log.Printf("[GetMovies] failed to fetch movies: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch movies"})
			return
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &movies); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode movies"})
			return
		}

		c.JSON(http.StatusOK, movies)
	}
}

func GetMovie(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()

		movieID := c.Param("imdb_id")

		if movieID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Movie ID is required"})
			return
		}

		var movie models.Movie

		var movieCollection *mongo.Collection = database.OpenCollection("movies", client)

		err := movieCollection.FindOne(ctx, bson.M{"imdb_id": movieID}).Decode(&movie)
		if err != nil {
			log.Printf("[GetMovie] failed to fetch movie %s: %v", movieID, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Movie not found"})
			return
		}
		c.JSON(http.StatusOK, movie)
	}
}

// AddMovie 添加电影的处理函数
func AddMovie(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()

		var movie models.Movie
		if err := c.ShouldBindJSON(&movie); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}
		if err := validate.Struct(movie); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed", "details": err.Error()})
			return
		}
		var movieCollection *mongo.Collection = database.OpenCollection("movies", client)

		result, err := movieCollection.InsertOne(ctx, movie)
		if err != nil {
			log.Printf("[AddMovie] failed to add movie %s: %v", movie.ImdbID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add movie"})
			return
		}
		c.JSON(http.StatusCreated, result)
	}
}

func AdminReviewUpdate(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, err := utils.GetRoleFromContext(c)
		if err != nil {
			log.Printf("[AdminReviewUpdate] failed to get role from context: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Role not found in context"})
			return
		}
		if role != "ADMIN" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User must be part of the ADMIN role"})
			return
		}

		movieId := c.Param("imdb_id")
		if movieId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Movie ID is required"})
			return
		}
		var req struct {
			AdminReview string `json:"admin_review"`
		}
		var resp struct {
			RankingName string `json:"ranking_name"`
			AdminReview string `json:"admin_review"`
		}

		if err := c.ShouldBind(&req); err != nil {
			log.Printf("[AdminReviewUpdate] invalid request body: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}
		sentiment, ranVal, err := GetReviewRanking(req.AdminReview, client, c)
		if err != nil {
			log.Printf("[AdminReviewUpdate] failed to get review ranking: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get review ranking"})
			return
		}

		filter := bson.M{"imdb_id": movieId}
		update := bson.M{
			"$set": bson.M{
				"admin_review": req.AdminReview,
				"ranking": bson.M{
					"ranking_value": ranVal,
					"ranking_name":  sentiment,
				},
			},
		}
		var ctx, cancel = context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()
		var movieCollection *mongo.Collection = database.OpenCollection("movies", client)

		result, err := movieCollection.UpdateOne(ctx, filter, update)
		if err != nil {
			log.Printf("[AdminReviewUpdate] failed to update movie %s: %v", movieId, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admin review"})
			return
		}

		if result.MatchedCount == 0 {
			log.Printf("[AdminReviewUpdate] movie not found for imdb_id=%s", movieId)
			c.JSON(http.StatusNotFound, gin.H{"error": "Movie not found"})
			return
		}

		resp.RankingName = sentiment
		resp.AdminReview = req.AdminReview
		c.JSON(http.StatusOK, resp)

	}
}

func GetReviewRanking(admin_review string, client *mongo.Client, c *gin.Context) (string, int, error) {
	rankings, err := GetRankings(client, c)
	if err != nil {
		return "", 0, err
	}

	sentimentDelimited := ""

	for _, ranking := range rankings {
		if ranking.RankingValue != 999 {
			sentimentDelimited += ranking.RankingName + ","
		}
	}

	sentimentDelimited = strings.TrimSuffix(sentimentDelimited, ",")

	err = godotenv.Load(".env")
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	GlmApiKey := os.Getenv("GLM_API_KEY")

	if GlmApiKey == "" {
		return "", 0, errors.New("couldn't read GLM_API_KEY")
	}

	llm, err := openai.New(
		openai.WithToken(GlmApiKey),
		openai.WithBaseURL("https://open.bigmodel.cn/api/paas/v4"),
		openai.WithModel("GLM-4.7-Flash"),
	)

	if err != nil {
		log.Printf("[GetReviewRanking] failed to init GLM client: %v", err)
		return "", 0, err
	}

	base_prompt_template := os.Getenv("BASE_PROMPT_TEMPLATE")

	base_prompt := strings.Replace(base_prompt_template, "{rankings}", sentimentDelimited, 1)

	response, err := llm.Call(c.Request.Context(), base_prompt+admin_review)
	if err != nil {
		log.Printf("[GetReviewRanking] GLM call failed: %v", err)
		return "", 0, err
	}
	response = strings.TrimSpace(response)

	ranVal := 0
	for _, ranking := range rankings {
		if ranking.RankingName == response {
			ranVal = ranking.RankingValue
			break
		}
	}

	return response, ranVal, nil
}

func GetRankings(client *mongo.Client, c *gin.Context) ([]models.Ranking, error) {
	var rankings []models.Ranking

	var ctx, cancel = context.WithTimeout(c.Request.Context(), 100*time.Second)
	defer cancel()
	var rankingCollection *mongo.Collection = database.OpenCollection("rankings", client)

	cursor, err := rankingCollection.Find(ctx, bson.M{})
	if err != nil {
		log.Printf("[GetRankings] failed to query rankings: %v", err)
		return nil, err
	}
	defer cursor.Close(ctx)
	if err := cursor.All(ctx, &rankings); err != nil {
		return nil, err
	}
	return rankings, nil
}

func GetRecommendedMovies(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId, err := utils.GetUserIdFromContext(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User Id not found in context"})
			return
		}

		favourite_genres, err := GetUserFavoriteGenres(userId, client, c)

		if err != nil {
			log.Printf("[GetRecommendedMovies] failed to get favorite genres for user %s: %v", userId, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		err = godotenv.Load(".env")
		if err != nil {
			log.Println("Warning: .env file not found")
		}
		var recommendMovieLimitVal int64 = 5
		recommendMovieLimitStr := os.Getenv("RECOMMENDED_MOVIE_LIMIT")
		if recommendMovieLimitStr != "" {
			recommendMovieLimitVal, _ = strconv.ParseInt(recommendMovieLimitStr, 10, 64)
		}

		findOptions := options.Find()
		findOptions.SetSort(bson.D{{Key: "ranking.ranking_value", Value: 1}})
		findOptions.SetLimit(recommendMovieLimitVal) // 限制返回的电影数量

		filter := bson.M{"genre.genre_name": bson.M{"$in": favourite_genres}}

		var ctx, cancel = context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()
		var movieCollection *mongo.Collection = database.OpenCollection("movies", client)

		cursor, err := movieCollection.Find(ctx, filter, findOptions)
		if err != nil {
			log.Printf("[GetRecommendedMovies] failed to find recommended movies for user %s: %v", userId, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find recommended movies"})
			return
		}
		defer cursor.Close(ctx)

		var recommendedMovies []models.Movie
		if err := cursor.All(ctx, &recommendedMovies); err != nil {
			log.Printf("[GetRecommendedMovies] failed to decode recommended movies for user %s: %v", userId, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recommended movies"})
			return
		}
		c.JSON(http.StatusOK, recommendedMovies)
	}
}

func GetUserFavoriteGenres(userId string, client *mongo.Client, c *gin.Context) ([]string, error) {
	var ctx, cancel = context.WithTimeout(c.Request.Context(), 100*time.Second)
	defer cancel()

	filter := bson.M{"user_id": userId}
	var result struct {
		FavouriteGenres []models.Genre `bson:"favourite_genres"`
	}
	var userCollection *mongo.Collection = database.OpenCollection("users", client)

	err := userCollection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("[GetUserFavoriteGenres] no user found for user_id=%s", userId)
			return []string{}, nil
		}
		log.Printf("[GetUserFavoriteGenres] failed to fetch favorite genres for user_id=%s: %v", userId, err)
		return nil, err
	}
	var genreNames []string
	for _, genre := range result.FavouriteGenres {
		if genre.GenreName != "" {
			genreNames = append(genreNames, genre.GenreName)
		}
	}
	return genreNames, nil
}

func GetGenres(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()
		var genres []models.Genre

		genreCollection := database.OpenCollection("genres", client)
		cursor, err := genreCollection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching movie genres"})
			return
		}
		defer cursor.Close(ctx)
		if err := cursor.All(ctx, &genres); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, genres)

	}
}
