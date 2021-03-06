/**
 * Weather 
 */
app.controller('fetchDataController', function ($scope, $http, $filter, $uibModal, $cookies, $window, $location) {

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


                var data2 = [{
                    type: 'scattergeo',
                    mode: 'markers',
                    lat: [$scope.coordinates.lat],
                    lon: [$scope.coordinates.lon],
                    marker: {
                        size: [10],
                        color: [20],
                        cmin: 0,
                        cmax: 50,
                        colorscale: 'Blues',
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
