package routes

import (
	"gitgame/controllers"
	"github.com/labstack/echo/v4"

)

func Init() *echo.Echo {
	e := echo.New()

	g := e.Group("/github")
	{
		g.GET("/login", controllers.Login)
		g.GET("/authenticate", controllers.Authenticate)
	}


	return e
}