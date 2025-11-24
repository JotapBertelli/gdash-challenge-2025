package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherPayload struct {
	City        string  `json:"city"`
	Timestamp   string  `json:"ts"`
	Temperature float64 `json:"temperature"`
	WindSpeed   float64 `json:"windspeed"`
	Humidity    float64 `json:"humidity"`
}

func main() {
	rabbitURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
	queue := getEnv("RABBITMQ_QUEUE", "weather_logs")
	apiBase := getEnv("API_BASE_URL", "http://api:3000/api")

	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Fatalf("Erro ao conectar RabbitMQ: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Erro ao abrir canal: %v", err)
	}
	defer ch.Close()

	msgs, err := ch.Consume(queue, "", false, false, false, false, nil)
	if err != nil {
		log.Fatalf("Erro ao consumir fila: %v", err)
	}

	log.Println("Worker aguardando mensagens...")
	for msg := range msgs {
		if err := processMessage(apiBase, msg.Body); err != nil {
			log.Printf("Erro ao processar mensagem: %v", err)
			msg.Nack(false, true)
			continue
		}
		msg.Ack(false)
	}
}

func processMessage(apiBase string, body []byte) error {
	var payload WeatherPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return fmt.Errorf("payload inválido: %w", err)
	}

	client := http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest(
		http.MethodPost,
		fmt.Sprintf("%s/weather/logs", apiBase),
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("API respondeu com status %d", resp.StatusCode)
	}

	log.Printf("Mensagem enviada para API: %s", payload.Timestamp)
	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

