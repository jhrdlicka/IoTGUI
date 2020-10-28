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
        $scope.axex = [];
        $scope.axey1 = [];
        $scope.axey2 = [];

        var url = "https://api.openweathermap.org/data/2.5/onecall?lat=" + $scope.coordinates.lat + "&lon=" + $scope.coordinates.lon + "&exclude=minutely,hourly&units=metric&appid=18d9b48c0feb1324a4df6a154732e3a1";

        $http({
            headers: { "Content-Type": "application/json" },
            url: url,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.forecasts = response.data.daily;

                // post-processing (formatovani UNIX timestampu na datum)
                angular.forEach($scope.forecasts, function (item, index) {
                    item.date = toChar(item.dt, "dd.MM.yyyy");
                    item.iconpath = "http://openweathermap.org/img/wn/" + item.weather[0].icon + "@2x.png";
                    $scope.axey1[index] = item.temp.min;
                    $scope.axey2[index] = item.temp.max;
                    $scope.axex[index] = toChar(item.dt, "dd.MM.yyyy");
                });

                $scope.current = "Current temp. " + response.data.current.temp + " (C)";
                $scope.currentTime = toChar(response.data.current.dt, "dd.MM.yyyy HH:mm");

                wf_chart = document.getElementById('wf_chart');

                var layout = {
                    title: 'Temperature Forecast',
                    xaxis: {
//                        title: 'Date',
//                        showgrid: false,
//                        zeroline: false
                    },
                    yaxis: {
                        title: String.fromCharCode(176) + "C",
                        showticksuffix: "last"
//                        showline: false
                    }
                };

                var trace0 = {
                    type: "scatter",
                    mode: "lines",
                    x: $scope.axex,
                    y: $scope.axey1,
                    line: { color: '#17BECF' },
                    name: "min"
                };

                var trace1 = {
                    type: "scatter",
                    mode: "lines",
                    x: $scope.axex,
                    y: $scope.axey2,
                    line: { color: "orange" },
                    name: "max"
                };

                var data = [trace0, trace1];

                Plotly.newPlot(wf_chart, data, layout);
                /*
                Plotly.addTraces(wf_chart, [{
                    x: $scope.axex,
                    y: $scope.axey2                   
                }]);
                */

                /*
                Plotly.d3.csv(
                    "https://raw.githubusercontent.com/plotly/datasets/master/2015_06_30_precipitation.csv",
                    function (err, rows) {
                        function unpack(rows, key) {
                            return rows.map(function (row) {
                                return row[key];
                            });
                        }

                        var data2 = [
                            {
                                type: "scattermapbox",
                                text: unpack(rows, "Globvalue"),
                                lon: unpack(rows, "Lon"),
                                lat: unpack(rows, "Lat"),
                                marker: { color: "fuchsia", size: 4 }
                            }
                        ];

                        var layout2 = {
                            dragmode: "zoom",
                            mapbox: { style: "open-street-map", center: { lat: 38, lon: -90 }, zoom: 3 },
                            margin: { r: 0, t: 0, b: 0, l: 0 }
                        };

                        Plotly.newPlot("wf_map", data2, layout2);
                    }
                );
                
                */

                var data2 = [{
                    type: 'scattergeo',
                    mode: 'markers',
//                    locations: ['FRA', 'DEU', 'RUS', 'ESP'],
                    lat: [$scope.coordinates.lat],
                    lon: [$scope.coordinates.lon],
                    marker: {
                        size: [10],
                        color: [20],
                        cmin: 0,
                        cmax: 50,
                        colorscale: 'Blues',
//                        colorbar: {
//                            title: 'Some rate',
//                            ticksuffix: '%',
//                            showticksuffix: 'last'
//                        },
                        line: {
                            color: 'black'
                        }
                    }
                }];

                var layout2 = {
                    title: 'Prediction Location',                    
//                    mapbox: { style: "open-street-map", center: { lat: $scope.coordinates.lat, lon: $scope.coordinates.lon }, zoom: 3 },
                    width: 450,
                    height: 400,
                    geo: {
                        scope: 'world',
                        resolution: 1000,
                        showcountries: true, 
                        showland: true,
                        showocean: false, 
                        showsubunits: true, subunitcolor: "Blue",
                        projection: { type:'mercator', scale:15 },
                        center: { lat: $scope.coordinates.lat, lon: $scope.coordinates.lon },
                        zoom: 300
                    },
                    margin: { r: 100, t: 60, b: 0, l: 60 }
                    
                };

                Plotly.newPlot("wf_map", data2, layout2);
                    


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
            url: "http://hrdlicky.eu/currentweather/api/Sensors",
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

            container.type = parseInt(container.type);

            if (container.id) {
                //UPDATE
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: "http://hrdlicky.eu/currentweather/api/Sensors/" + container.id,
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
                // create a container without "id" field
                var l_container = angular.copy(container); //Object.assign({}, container);
                delete l_container['id'];
              
                //INSERT
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: "http://hrdlicky.eu/currentweather/api/Sensors",
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
            url: "http://hrdlicky.eu/currentweather/api/Sensors/" + sensor.id,
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
//            url: "https://cors-anywhere.herokuapp.com/http://hrdlicky.eu/currentweather/api/Sensors/" + sensor.id,
            url: "http://hrdlicky.eu/currentweather/api/Sensors/" + sensor.id,
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
        $scope.myForm.$rollbackViewValue();
        $uibModalInstance.dismiss('cancel');
    };
});