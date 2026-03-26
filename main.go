package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type ChatRequest struct {
	Model    string        `json:"model"`
	Stream   bool          `json:"stream"`
	Messages []interface{} `json:"messages"`
}

func main() {
	r := gin.Default()

	// ✅ CORS FIX
	r.Use(cors.Default())

	r.POST("/api/chat", func(c *gin.Context) {
		var req ChatRequest

		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		jsonData, _ := json.Marshal(req)

		// 🔥 Forward ke Ollama
		resp, err := http.Post("http://localhost:11434/api/chat", "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)

		// return langsung ke frontend
		c.Data(resp.StatusCode, "application/json", body)
	})

	r.Run(":8080") // server jalan di localhost:8080
}