/**
 * pcm_customer list
 */
app.controller('pcm_customercontroller', function ($scope, $http, $uibModal) {

     $scope.loadData = function () {
        $scope.pcm_customers = null;
        $scope.selectedpcm_customer = null;

        $http({
             headers: { "Content-Type": "application/json" },
             url: $scope.ApiAddress + "api/pcm_customer",
             withCredentials: true,
             method: 'GET'
        })
             .then(function success(response) {
                 $scope.pcm_customers = response.data;
                 //console.log("pcm_customers", $scope.pcm_customers);
             }, function error(error) {
                     if (error.status == 401)
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



    $scope.pcm_customeredit = function (pcm_customer) {
        if (!pcm_customer)
            pcm_customer = { id: null, type: null, description: null };

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/pcm_customeredit.html',
            controller: 'pcm_customereditcontroller',
            size: '',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return pcm_customer;
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
                    url: $scope.ApiAddress + "api/pcm_customer/" + container.id,
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
                    url: $scope.ApiAddress + "api/pcm_customer",
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

    $scope.pcm_customerdelete = function (pcm_customer) {
        if (!confirm("Delete client '" + pcm_customer.Firstname + pcm_customer.surname + "'. Are you sure?"))
            return;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $scope.ApiAddress + "api/pcm_customer/" + pcm_customer.id,
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

    $scope.selectedpcm_customer = null;

    $scope.pcm_customerdata = function (pcm_customer) {
        $scope.selectedpcm_customer = null;
        if (!pcm_customer)
            return;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $scope.ApiAddress + "api/pcm_customer/" + pcm_customer.id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.selectedpcm_customer = response.data;

                //console.log("selectedpcm_customer", $scope.selectedpcm_customer);

            }, function error(error) {
                console.error('error', error);
            });
    };

});

app.controller('pcm_customereditcontroller', function ($scope, $uibModalInstance, container) {

    $scope.pcm_customer = container;
    //console.log($scope.pcm_customer);

    $scope.ok = function () {
        $uibModalInstance.close($scope.pcm_customer);
    };

    $scope.cancel = function () {        
        $scope.myForm.$rollbackViewValue();
        $uibModalInstance.dismiss('cancel');
    };
});