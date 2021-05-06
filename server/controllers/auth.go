package controllers

import (
	"gitgame/services"
	"net/http"
	"github.com/labstack/echo/v4"
)

func Login(c echo.Context) error {
	loginUrl := services.GetLoginUrl()
	return c.Redirect(http.StatusPermanentRedirect , loginUrl)
}

func Authenticate(c echo.Context) error {
	code := c.QueryParam("code")
	githubAccessToken := services.GetAccessToken(code)
	if githubAccessToken == nil {
		return c.String(http.StatusBadRequest, "Failed to auth using github - access token")
	}

	user := services.GetUserDetails(githubAccessToken["access_token"])
	if user == nil {
		return c.String(http.StatusBadRequest, "Failed to auth using github - user details")
	}

	accessToken := services.GenerateAccessToken(user["login"].(string))["access_token"]
	refreshToken := services.GenerateRefreshToken(user["login"].(string))["refresh_token"]
	
	return c.JSON(http.StatusOK, map[string]string{
		"access_token": accessToken,
		"refresh_token": refreshToken,
	})
}