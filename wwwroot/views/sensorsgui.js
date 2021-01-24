/**
 * Sensor list
 */
app.controller('sensorController', function ($scope, $http, $uibModal, $rootScope, ker_reference, $q, multiline, guialert) {


    $scope.controllerName = 'sensorcontroller';
    $scope.multilineallowed = true;

    $scope.getsamples = function (sensorindex) {

        var promise1 = $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_sample/devicecodedate/"+$scope.sensors[sensorindex].code+"/2021-01-15/2199-12-31",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.sensors[sensorindex].samples = response.data;
                var promises = [];
                angular.forEach($scope.sensors[sensorindex].samples, function (item, lIndex) {
                    $scope.sensors[sensorindex].samples[lIndex].index = lIndex;                    
                    $scope.sensors[sensorindex].samples[lIndex].timestampdate = new Date(item.timestamp); //"2020-11-13T21:42:18.77"   "2020-11-27T08:00:00+01:00"

                    /*
                    $scope.pcm_orders[orderindex].ordersessions[lIndex].calevent = null;
                    var promise = $http({
                        headers: { "Content-Type": "application/json" },
                        url: $rootScope.ApiAddress + "api/pcm_calevent/" + item.caleventid,
                        withCredentials: true,
                        method: 'GET'
                    })
                        .then(function success(response2) {
                            $scope.pcm_orders[orderindex].ordersessions[lIndex].calevent = response2.data;
                            return response2.$promise;
                        }, function error(error) {
                            $rootScope.showerror($scope, 'getordersessions.2', error);
                            $scope.pcm_orders[orderindex].ordersessions[lIndex].calevent = null;
                        });
                    promises.push(promise);
                    */
                });
                return $q.all(promises);
            }, function error(error) {
                    $rootScope.showerror($scope, 'getsamples.1', error);
                    $scope.sensors[sensorindex].samples = null;
            });

        promise1.then(function (promiseArray) {
            //$scope.getxvalues(sensorindex);
        });

    };


    $scope.loadData = function () {
        $scope.sensors = null;
        $scope.selectedSensor = null;
//        $rootScope.resetSelection($rootScope.sensorlistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_device",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.sensors = response.data;

//                $rootScope.resetSelection($rootScope.sensorlistid);
                angular.forEach($scope.sensors, function (item, lIndex) {
                    $scope.sensors[lIndex].index = lIndex;
                    $scope.getsamples(lIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
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
                    url: $rootScope.ApiAddress + "api/iot_device/" + container.id,
                    withCredentials: true,
                    method: 'PUT',
                    datatype: "json",
                    data: JSON.stringify(container)
                })
                    .then(function success(response) {
                        $scope.loadData();
                    }, function error(error) {
                            if (error.status == 401)
                                alert("Access Denied!!!");
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
                    url: $rootScope.ApiAddress + "api/iot_device",
                    withCredentials: true,
                    method: 'POST',
                    datatype: "json",
                    data: JSON.stringify(l_container)
                })
                    .then(function success(response) {
                        $scope.loadData();
                    }, function error(error) {
                            if (error.status == 401)
                                alert("Access Denied!!!");
                        console.error('error', error);
                    });
            }

        }, function () { /* cancel */ });
    };

    $scope.sensorDelete = function (sensor) {
        if (!confirm("Delete sensor '" + sensor.code + "'. Are you sure?"))
            return;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_device/" + sensor.id,
            withCredentials: true,
            method: 'DELETE'
        })
            .then(function success(response) {
                $scope.loadData();
            }, function error(error) {
                    if (error.status == 401)
                        alert("Access Denied!!!");
                console.error('error', error);
            });
    };

    $scope.selectedSensor = null;

    $scope.sensorData = function (sensor) {
        $scope.selectedSensor = null;
        if (!sensor)
            return;

        $scope.selectedSensor = sensor; 

        TESTER = document.getElementById('tester');
        var lAxeX = $scope.selectedSensor.samples.map(a => a.timestampdate);
        var lAxeY = $scope.selectedSensor.samples.map(a => a.value);
        if (TESTER) {

            var layout = {
                title: 'Samples',
                xaxis: {
                    //                        title: 'Date',
                    //                        showgrid: false,
                    //                        zeroline: false
                },
                yaxis: {
                    title: sensor.unitnm,
                    showticksuffix: "last"
                    //                        showline: false
                }
            };

            var trace0 = {
                type: "scatter",
                mode: "lines",
                x: lAxeX,
                y: lAxeY,
                line: { color: '#17BECF' },
                name: sensor.code
            };

            /*
            var trace1 = {
                type: "scatter",
                mode: "lines",
                x: $scope.axex,
                y: $scope.axey2,
                line: { color: "orange" },
                name: "max"
            };
            */

            var data = [trace0/*, trace1*/];

            Plotly.newPlot(TESTER, data, layout);

            
        }

/*
        $http({
            headers: { "Content-Type": "application/json" },
//            url: "https://cors-anywhere.herokuapp.com/http://hrdlicky.eu/currentweather/api/Sensors/" + sensor.id,
            url: $rootScope.ApiAddress + "api/iot_device/" + sensor.id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.selectedSensor = response.data;

                //console.log("selectedSensor", $scope.selectedSensor);

            }, function error(error) {
                console.error('error', error);
            });
    */

    };

});

app.controller('sensorEditController', function ($scope, $uibModalInstance, container, $rootScope, ker_reference) {


    $rootScope.kerReftabGetList('DEVICECATEGORY')
        .then(function (result) {
            $scope.devicecategorylist = result[0];
        });

    $rootScope.kerReftabGetList('DEVICETYPE')
        .then(function (result) {
            $scope.devicetypelist = result[0];
        });

    $rootScope.kerReftabGetList('UNIT')
        .then(function (result) {
            $scope.unitlist = result[0];
        });

    $rootScope.kerReftabGetList('LOCATION')
        .then(function (result) {
            $scope.locationlist = result[0];
        });

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