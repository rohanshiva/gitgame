package services

import (
	"github.com/dgrijalva/jwt-go"
	"github.com/joho/godotenv"
	"time"
	"os"
)

func GenerateAccessToken(login string) map[string]string {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["login"] = login
	claims["scope"] = "access"
	claims["exp"] = time.Now().Add(time.Minute * 15).Unix()

	err := godotenv.Load()
	if err != nil {
		panic("Unable to load environment variables")
	}
	
	t, err := token.SignedString([]byte(os.Getenv("SECRET")))
	
	if err != nil {
		return nil
	}

	return map[string]string{"access_token": t}
}

func GenerateRefreshToken(login string) map[string]string {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["login"] = login
	claims["scope"] = "refresh"
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	err := godotenv.Load()
	if err != nil {
		panic("Unable to load environment variables")
	}
	
	t, err := token.SignedString([]byte(os.Getenv("SECRET")))
	
	if err != nil {
		return nil
	}

	return map[string]string{"refresh_token": t}
}
