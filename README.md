# hrdlicky
.Net Core Web API, Angular JS

API swagger endpoint
http://localhost:44357/swagger

API example (Controllers/WeatherForecastController.cs)
http://localhost:44357/WeatherForecast

Angular JS client (wwwroot)
http://localhost:44357/index.html

app.js
- angular routes
- angular controllers

> example for call "own" API (app.js "fetchDataController"):
>    $http({
>        headers: { "Content-Type": "application/json" }, url: "WeatherForecast", method: 'GET'
>    })
>        .then(function success(response) {
>            console.log("response.data", response.data);
>        }, function error(error) {
>            console.error('error', error);
>        });

views
- html "snippets"

