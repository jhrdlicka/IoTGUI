/**
 * Sensor list
 */
app.controller('sensorController', function ($scope, $http, $uibModal, $rootScope, ker_reference) {

     $scope.loadData = function () {
        $scope.sensors = null;
        $scope.selectedSensor = null;

        $http({
             headers: { "Content-Type": "application/json" },
             url: $rootScope.ApiAddress + "api/iot_device",
             withCredentials: true,
             method: 'GET'
        })
             .then(function success(response) {
                 $scope.sensors = response.data;
                 //console.log("sensors", $scope.sensors);
             }, function error(error) {
                     if (error.status == 401)
                         alert("Access Denied!!!");
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