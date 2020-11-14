/**
 * pcm_calevent list
 */
app.controller('pcm_caleventcontroller', function ($scope, $http, $uibModal) {


    $scope.getcustomer = function (caleventid) {
        if (!$scope.pcm_calevents[caleventid].customerid)
            $scope.pcm_calevents[caleventid].customer = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $scope.ApiAddress + "api/pcm_customer/"+$scope.pcm_calevents[caleventid].customerid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_calevents[caleventid].customer = response.data;                

            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    alert("Unknown Error!");
                console.error('error', error);
                $scope.pcm_calevents[caleventid].customer = null;
            });

    };



    $scope.loadData = function () {
        $scope.pcm_calevents = null;
        $scope.selectedpcm_calevent = null;

        $http({
             headers: { "Content-Type": "application/json" },
             url: $scope.ApiAddress + "api/pcm_calevent",
             withCredentials: true,
             method: 'GET'
        })
             .then(function success(response) {
                 $scope.pcm_calevents = response.data;
                 //console.log("pcm_calevents", $scope.pcm_calevents);
                 angular.forEach($scope.pcm_calevents, function (item, index) {
                     $scope.pcm_calevents[index].startdate = new Date(item.start);
                     $scope.pcm_calevents[index].starttime = new Date(item.start);                   
                     $scope.pcm_calevents[index].totime = new Date(item.start);
                     $scope.pcm_calevents[index].totime.setMinutes($scope.pcm_calevents[index].totime.getMinutes() + item.duration.value.totalMinutes);
                     $scope.pcm_calevents[index].durationtime = new Date($scope.pcm_calevents[index].totime - $scope.pcm_calevents[index].starttime);                     
                     $scope.getcustomer(index);

                     $scope.pcm_calevents[index].totime = $scope.pcm_calevents[index].totime;  //                     

                 });

             }, function error(error) {
                     if (error.status == 401)
                         alert("Access Denied!!!");
                     else
                         alert("Unknown Error!");
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



    $scope.pcm_caleventedit = function (pcm_calevent) {
        if (!pcm_calevent)
            pcm_calevent = { id: null, type: null, description: null }; 

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/pcm_caleventedit.html',
            controller: 'pcm_caleventeditcontroller',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return pcm_calevent;
                }
            }
        });

        modalInstance.result.then(function (container) {
            /* ok */

            container.type = parseInt(container.type);
            var xcont = JSON.stringify(container);

            if (container.id) {
                //UPDATE
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $scope.ApiAddress + "api/pcm_calevent/" + container.id,
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
              
                //INSERT
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $scope.ApiAddress + "api/pcm_calevent",
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

    $scope.pcm_caleventdelete = function (pcm_calevent) {
        if (!confirm("Delete event with '" + pcm_calevent.customer.firstname + pcm_calevent.customer.surname + "'. Are you sure?"))
            return;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $scope.ApiAddress + "api/pcm_calevent/" + pcm_calevent.id,
            withCredentials: true,
            method: 'DELETE'
        })
            .then(function success(response) {
                $scope.loadData();
            }, function error(error) {
                    if (error.status == 401)
                        alert("Access Denied!!!");
                    else
                        alert("Unknown Error!");
                console.error('error', error);
            });
    };

    $scope.selectedpcm_calevent = null;

    $scope.pcm_caleventdata = function (pcm_calevent) {
        $scope.selectedpcm_calevent = null;
        if (!pcm_calevent)
            return;

        $scope.selectedpcm_calevent = pcm_calevent;
    };

});

app.controller('pcm_caleventeditcontroller', function ($scope, $uibModalInstance, container, $uibModal) {

    $scope.currencylist = [
        { Value: null, Text: "--Currency--" },
        { Value: "CZK", Text: "CZK" },
        { Value: "EUR", Text: "EUR" },
        { Value: "USD", Text: "USD" }
    ];

    $scope.pcm_calevent = container;
    //console.log($scope.pcm_calevent);

    $scope.ok = function () {
        $uibModalInstance.close($scope.pcm_customer);
    };

    $scope.cancel = function () {
        $scope.myForm.$rollbackViewValue();
        $uibModalInstance.dismiss('cancel');
    };
});