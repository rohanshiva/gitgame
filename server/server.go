package main 

import (
	"gitgame/routes"
)

func main() {
	router := routes.Init()
	router.Start("127.0.0.1:8000")
}