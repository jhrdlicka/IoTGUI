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
                 angular.forEach($scope.pcm_customers, function (item, index) {
                     $scope.pcm_customers[index].photo = atob(item.photo);
                 });

             }, function error(error) {
                     if (error.status == 401)
                         alert("Access Denied!!!");
                     else
                         alert("Unknows Error!");
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
            size: 'lg',
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
            var xcont = JSON.stringify(container);

            if (container.id) {
                container.photo = btoa(container.photo);
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
                                alert("Access Denied!!!")
                            else
                                alert("Unknown Error");
                            console.error('error', error);
                    });
            }
            else {
                // create a container without "id" field
                var l_container = angular.copy(container); //Object.assign({}, container);
                delete l_container['id'];
                l_container.photo = btoa(l_container.photo);
              
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
                                alert("Access Denied!!!")
                            else
                                alert("Unknown Error!");
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
                    else
                        alert("Unknows Error!");
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
                    if (error.status == 401)
                        alert("Access Denied!!!");
                    else
                        alert("Unknows Error!");
                    console.error('error', error);
            });
    };

});

app.controller('pcm_customereditcontroller', function ($scope, $uibModalInstance, container, $uibModal) {

    $scope.currencylist = [
        { Value: null, Text: "--Currency--" },
        { Value: "CZK", Text: "CZK" },
        { Value: "EUR", Text: "EUR" },
        { Value: "USD", Text: "USD" }
    ];

    $scope.pcm_customer = container;
    //console.log($scope.pcm_customer);

    $scope.pcm_customerpictureedit = function (pcm_customer) {

        var modal2Instance = $uibModal.open({
            templateUrl: 'views/partials/pcm_customerpicture.html',
            controller: 'pcm_customerpicturecontroller',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return pcm_customer;
                }
            }
        });

        modal2Instance.result.then(function (container) {
            /* ok */

        }, function () { /* cancel */ });
    };

    $scope.ok = function () {
        $uibModalInstance.close($scope.pcm_customer);
    };

    $scope.cancel = function () {        
        $scope.myForm.$rollbackViewValue();
        $uibModalInstance.dismiss('cancel');
    };
});


// Function that calls ng-upload's Upload function

app.controller('pcm_customerpicturecontroller', function ($scope, $uibModalInstance, container) {
    $scope.pcm_customer = container;
    //console.log($scope.pcm_customer);

    $scope.profileimage = function (selectimage) {
        console.log(selectimage.files[0]);
        var selectfile = selectimage.files[0];
        r = new FileReader();
        r.onloadend = function (e) {
            //debugger;
            $scope.pcm_customer.photo = e.target.result;
        }
        r.readAsDataURL(selectfile);
        $uibModalInstance.close($scope.pcm_customer);
    }

    $scope.ok = function () {
         $uibModalInstance.close($scope.pcm_customer);
    };

    $scope.cancel = function () {
        $scope.myForm.$rollbackViewValue();
        $uibModalInstance.dismiss('cancel');
    };
});
