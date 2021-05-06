package services

import (
	"encoding/json"

	"net/http"
	"net/url"
	"os"

	"github.com/joho/godotenv"
)


func GetLoginUrl() string {
	
	err := godotenv.Load()
	if err != nil {
		panic("Unable to load environment variables")
	}

	params := url.Values{}
	params.Add("client_id",  os.Getenv("CLIENT_ID"))
	params.Add("client_secret", os.Getenv("CLIENT_SECRET"))

	url := os.Getenv("GITHUB_LOGIN_URL") + params.Encode()
	return url
}

func GetAccessToken (code string) map[string]string {
	err := godotenv.Load()
	if err != nil {
		panic("Unable to load environment variables")
	}

	params := url.Values{}
	params.Add("client_id",  os.Getenv("CLIENT_ID"))
	params.Add("client_secret", os.Getenv("CLIENT_SECRET"))
	params.Add("code", code)
	redirect_uri := "&redirect_uri=" + os.Getenv("REDIRECT_URI")
	url := os.Getenv("ACCESS_TOKEN_URL") + params.Encode() +  redirect_uri

	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Accept", "application/json")
	resp, err := client.Do(req)

	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	return result
}

func GetUserDetails(accessToken string) map[string]interface{} {
	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Add("Authorization", "token " + accessToken)
	resp, err := client.Do(req)

	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result
}