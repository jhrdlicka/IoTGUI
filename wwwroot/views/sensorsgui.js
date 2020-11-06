/**
 * Sensor list
 */
app.controller('sensorController', function ($scope, $http, $uibModal) {

     $scope.loadData = function () {
        $scope.sensors = null;
        $scope.selectedSensor = null;

        $http({
             headers: { "Content-Type": "application/json" },
             url: $scope.ApiAddress + "api/Sensors",
             withCredentials: true,
             method: 'GET'
        })
             .then(function success(response) {
                 $scope.sensors = response.data;
                 //console.log("sensors", $scope.sensors);
             }, function error(error) {
                     if (error.status = 401)
                         alert("Access Denied!!!");
                 console.error('error', error);
             });

    };

    $http({
        method: 'GET',
        url: '/api/Configuration/ConfigurationData'
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        $scope.ApiAddress = response.data.ApiAddress;
        console.log("ApiAddress", $scope.ApiAddress);

        $scope.loadData();

    }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });



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
                    url: $scope.ApiAddress + "api/Sensors/" + container.id,
                    withCredentials: true,
                    method: 'PUT',
                    datatype: "json",
                    data: JSON.stringify(container)
                })
                    .then(function success(response) {
                        $scope.loadData();
                    }, function error(error) {
                            if (error.status = 401)
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
                    url: $scope.ApiAddress + "api/Sensors",
                    withCredentials: true,
                    method: 'POST',
                    datatype: "json",
                    data: JSON.stringify(l_container)
                })
                    .then(function success(response) {
                        $scope.loadData();
                    }, function error(error) {
                            if (error.status = 401)
                                alert("Access Denied!!!");
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
            url: $scope.ApiAddress + "api/Sensors/" + sensor.id,
            withCredentials: true,
            method: 'DELETE'
        })
            .then(function success(response) {
                $scope.loadData();
            }, function error(error) {
                    if (error.status = 401)
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
            url: $scope.ApiAddress + "api/Sensors/" + sensor.id,
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