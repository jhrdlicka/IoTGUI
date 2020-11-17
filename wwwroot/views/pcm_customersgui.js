/**
 * pcm_customer list
 */
app.controller('pcm_customercontroller', function ($scope, $http, $uibModal) {

    $scope.getphoto = function (index) {
        if (!$scope.pcm_customers[index].id)  // customer does not exist
            $scope.pcm_customers[index].photodocument = { "content": null, "url": null, "id": null };
        else

            if (!$scope.pcm_customers[index].photodocumentid)  // customer picture does not exist
                $scope.pcm_customers[index].photodocument = {"content":null, "url":null, "id":null};
            else {
                $http({
                    headers: { "Content-Type": "application/json" },
                    //            url: $scope.ApiAddress + "api/pcm_customer/" + $scope.pcm_customers[index].id+"/photo",
                    url: $scope.ApiAddress + "api/doc_document/" + $scope.pcm_customers[index].photodocumentid,
                    withCredentials: true,
                    method: 'GET'
                })
                    .then(function success(response) {
                        $scope.pcm_customers[index].photodocument = response.data;
                        $scope.pcm_customers[index].photodocument.content = atob($scope.pcm_customers[index].photodocument.content);  // transform json data from base-64 encoded string to raw string

                    }, function error(error) {
                        console.error('error', error);
                            $scope.pcm_customers[index].photodocument = { "content": null, "url": null, "id": null };
                    });
            }


    };

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
                     $scope.getphoto(index);
                 });

             }, function error(error) {
/*                     if (error.status == 401)
                         alert("Access Denied!!!");
                     else
                         alert("Unknown Error!");
                         */
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

            if (container.id) {
                var l_container = angular.copy(container); //Object.assign({}, container);
                var l_containerupdate = angular.copy(l_container); //Object.assign({}, container);
                delete l_containerupdate['photodocument']; 
                //UPDATE
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $scope.ApiAddress + "api/pcm_customer/" + l_container.id,
                    withCredentials: true,
                    method: 'PUT',
                    datatype: "json",
                    data: JSON.stringify(l_containerupdate)
                })
                    .then(function success(response) {
//                        $scope.loadData();
                    }, function error(error) {
                            if (error.status == 401)
                                alert("Access Denied!!!")
                            else
                                alert("1: Unknown Error");
                            console.error('error', error);
                    });

                if (!l_container.photodocumentid) {
                    // create a new document

                    var l_photocontainer = angular.copy(l_container.photodocument); //Object.assign({}, container);
                    delete l_photocontainer['id'];
                    l_photocontainer.content = btoa(l_photocontainer.content);

                    //                l_container.photo = btoa(l_container.photo);

                    var xjson = JSON.stringify(l_photocontainer);

                    //INSERT PHOTODOCUMENT
                    $http({
                        headers: { "Content-Type": "application/json" },
                        url: $scope.ApiAddress + "api/doc_document",
                        withCredentials: true,
                        method: 'POST',
                        datatype: "json",
                        data: xjson
                    })
                        .then(function success(response) {
                            // udpate pcm_customer.photodocumentid
                            l_container.photodocumentid = response.data.id;
                            delete l_container['photodocument'];

                            $http({
                                headers: { "Content-Type": "application/json" },
                                url: $scope.ApiAddress + "api/pcm_customer/"+l_container.id,
                                withCredentials: true,
                                method: 'PUT',
                                datatype: "json",
                                data: JSON.stringify(l_container)
                            })
                                .then(function success(response) {

                                    $scope.loadData();
                                }, function error(error) {
                                    if (error.status == 401)
                                        alert("Access Denied!!!")
                                    else
                                        alert("2: Unknown Error!");
                                    console.error('error', error);
                                });

                            $scope.loadData();
                        }, function error(error) {
                            if (error.status == 401)
                                alert("Access Denied!!!")
                            else
                                alert("3: Unknown Error!");
                            console.error('error', error);
                        });


                }
                else {
                    // update existing photodocument
                    l_container.photodocument.content = btoa(l_container.photodocument.content);
                    $http({
                        headers: { "Content-Type": "application/json" },
                        url: $scope.ApiAddress + "api/doc_document/" + l_container.photodocumentid,
                        withCredentials: true,
                        method: 'PUT',
                        datatype: "json",
                        data: JSON.stringify(l_container.photodocument)
                    })
                        .then(function success(response) {
                            //$scope.loadData();
                        }, function error(error) {
                            if (error.status == 401)
                                alert("Access Denied!!!")
                            else
                                alert("4: Unknown Error");
                            console.error('error', error);
                        });
                }


            }
            else {
                // create a container without "id" field
                var l_container = angular.copy(container); //Object.assign({}, container);
                delete l_container['id'];
                delete l_container['photo'];

//                l_container.photo = btoa(l_container.photo);

                var xjson = JSON.stringify(l_container);

                //INSERT
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $scope.ApiAddress + "api/pcm_customer",
                    withCredentials: true,
                    method: 'POST',
                    datatype: "json",
                    data: xjson
                })
                    .then(function success(response) {
                        $scope.loadData();
                    }, function error(error) {
                            if (error.status == 401)
                                alert("Access Denied!!!")
                            else
                                alert("5: Unknown Error!");
                            console.error('error', error);
                    });
            }

        }, function () { /* cancel */ });
    };

    $scope.pcm_customerdelete = function (pcm_customer) {
        if (!confirm("Delete client '" + pcm_customer.name+"'. Are you sure?"))
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
                        alert("6: Unknown Error!");
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
                        alert("7: Unknown Error!");
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
            $scope.pcm_customer.photodocument.content = e.target.result;
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
