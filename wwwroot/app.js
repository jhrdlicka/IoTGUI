var app = angular.module('myApp', ['ngRoute', 'ui.bootstrap']);

/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        // Home
        .when("/", { templateUrl: "views/sensorsgui.html", controller: "sensorController" })
        // Pages
        .when("/fetch", { templateUrl: "views/fetch-data.html", controller: "fetchDataController" })
        // else 404
        .otherwise("/404", { templateUrl: "views/shared/404.html", controller: "commonController" });
}]);


/**
 * Common 
 */
app.controller('commonController', function ($scope, $http, $filter) {

});


/**
 * Weather 
 */
app.controller('fetchDataController', function ($scope, $http, $filter, $uibModal) {

    var toChar = function (unix_timestamp, format) {
        var date = new Date(unix_timestamp * 1000);
        return $filter('date')(date, format);
    }

    $scope.coordinates = {
        lat: "50.1731583",
        lon: "13.9568528"
    };

    $scope.loadData = function () {
        $scope.forecasts = null;

        var url = "https://api.openweathermap.org/data/2.5/onecall?lat=" + $scope.coordinates.lat + "&lon=" + $scope.coordinates.lon + "&exclude=minutely,hourly&units=metric&appid=18d9b48c0feb1324a4df6a154732e3a1";

        $http({
            headers: { "Content-Type": "application/json" },
            url: url,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.forecasts = response.data.daily;

                // post-processing (formatovani UNIX timestampu na datum)
                angular.forEach($scope.forecasts, function (item) {
                    item.date = toChar(item.dt, "dd.MM.yyyy");
                });

                $scope.current = "Current temp. " + response.data.current.temp + " (C)";
                $scope.currentTime = toChar(response.data.current.dt, "dd.MM.yyyy HH:mm");

            }, function error(error) {
                console.error('error', error);
            });
    }

    $scope.loadData();

    $scope.editCoordinates = function () {

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/coordinates.html',
            controller: 'coordinatesController',
            size: 'sm',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return $scope.coordinates;
                }
            }
        });

        modalInstance.result.then(function (container) {
            /* ok */
            $scope.coordinates.lat = container.lat;
            $scope.coordinates.lon = container.lon;

            $scope.loadData();
        }, function () { /* cancel */ });
    }

    // Priklad nacteni dat z "vlastniho" sajtu //Controllers/WeatherForecastController.cs
    $http({
        headers: { "Content-Type": "application/json" }, url: "WeatherForecast", method: 'GET'
    })
        .then(function success(response) {
            console.log("response.data", response.data);
        }, function error(error) {
            console.error('error', error);
        });
});

app.controller('coordinatesController', function ($scope, $uibModalInstance, container) {

    $scope.coordinates = container;

    $scope.ok = function () {
        $uibModalInstance.close($scope.coordinates);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});


/**
 * Sensor list
 */
app.controller('sensorController', function ($scope, $http, $uibModal) {

    $scope.loadData = function () {
        $scope.sensors = null;
        $scope.selectedSensor = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: "https://cors-anywhere.herokuapp.com/http://hrdlicky.eu/currentweather/api/Sensors",
            method: 'GET'
        })
            .then(function success(response) {
                $scope.sensors = response.data;
                //console.log("sensors", $scope.sensors);
            }, function error(error) {
                console.error('error', error);
            });
    };

    $scope.loadData();

    $scope.sensorEdit = function (sensor) {
        if (!sensor)
            sensor = { id: null, type: null, description: null };

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/sensorEdit.html',
            controller: 'sensorEditController',
            size: '',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return sensor;
                }
            }
        });

        modalInstance.result.then(function (container) {
            /* ok */

            container.type = Number(container.type);
            if (container.id) {
                //UPDATE
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: "https://cors-anywhere.herokuapp.com/http://hrdlicky.eu/currentweather/api/Sensors/" + container.id,
                    method: 'PUT',
                    datatype: "json",
                    data: JSON.stringify(container)
                })
                    .then(function success(response) {
                        $scope.loadData();
                    }, function error(error) {
                        console.error('error', error);
                    });
            }
            else {
                l_container = Object.assign({}, container);
                delete l_container['id'];
                
                //INSERT
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: "https://cors-anywhere.herokuapp.com/http://hrdlicky.eu/currentweather/api/Sensors",
                    method: 'POST',
                    datatype: "json",
                    data: JSON.stringify(l_container)
                })
                    .then(function success(response) {
                        $scope.loadData();
                    }, function error(error) {
                        console.error('error', error);
                    });
            }

        }, function () { /* cancel */ });
    };

    $scope.sensorDelete = function (sensor) {
        if (!confirm("Delete sensor '" + sensor.description + "'. Are you sure?"))
            return;

        $http({
            headers: { "Content-Type": "application/json" },
            url: "https://cors-anywhere.herokuapp.com/http://hrdlicky.eu/currentweather/api/Sensors/" + sensor.id,
            method: 'DELETE'
        })
            .then(function success(response) {
                $scope.loadData();
            }, function error(error) {
                console.error('error', error);
            });
    };

    $scope.selectedSensor = null;

    $scope.sensorData = function (sensor) {
        $scope.selectedSensor = null;
        if (!sensor)
            return;

        $http({
            headers: { "Content-Type": "application/json" },
            url: "https://cors-anywhere.herokuapp.com/http://hrdlicky.eu/currentweather/api/Sensors/" + sensor.id,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.selectedSensor = response.data;

                //console.log("selectedSensor", $scope.selectedSensor);

            }, function error(error) {
                console.error('error', error);
            });
    };

});

app.controller('sensorEditController', function ($scope, $uibModalInstance, container) {

    $scope.types = [
        { Value: null, Text: "--Please choose a sensortype--" },
        { Value: 0, Text: "WEATHER" },
        { Value: 1, Text: "WEATHERFORECAST" },
        { Value: 2, Text: "WATERLEVEL" },
        { Value: 3, Text: "DISTANCE" }
    ];

    $scope.sensor = container;
    //console.log($scope.sensor);

    $scope.ok = function () {
        $uibModalInstance.close($scope.sensor);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});