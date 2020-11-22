/**
 * pcm_customer list
 */
app.controller('pcm_customercontroller', function ($scope, $http, $uibModal, $rootScope, multiline) {

    $scope.getphoto = function (index) {
        if (!$scope.pcm_customers[index].id)  // customer does not exist
            $scope.pcm_customers[index].photodocument = { "content": null, "url": null, "id": null };
        else

            if (!$scope.pcm_customers[index].photodocumentid)  // customer picture does not exist
                $scope.pcm_customers[index].photodocument = {"content":null, "url":null, "id":null};
            else {
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $rootScope.ApiAddress + "api/doc_document/" + $scope.pcm_customers[index].photodocumentid,
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
             url: $rootScope.ApiAddress + "api/pcm_customer",
             withCredentials: true,
             method: 'GET'
        })
             .then(function success(response) {
                 $scope.pcm_customers = response.data;
                 $rootScope.pcm_customers = $scope.pcm_customers;

                 $rootScope.resetSelection($rootScope.customerlistid);
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

    $scope.loadData();


    $scope.new = function () {
        l_data = { id: null };  // set id to null and other items to defaults
        $scope.detail(l_data);
    }

    $scope.edit = function () {
        l_data = $rootScope.getSelectedRows($scope.customerlistid, $scope.pcm_customers);
        if (l_data.length != 1) {
            console.error('error', 'invalid number of records');
            return;
        }
        
        $scope.detail(l_data[0]);
    };

    $scope.detail = function (l_data) {

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/pcm_customeredit.html',
            controller: 'pcm_customereditcontroller',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return l_data;
                }
            }
        });

        modalInstance.result.then(function (container) {
            /* ok */
            container.type = parseInt(container.type);

            if (container.id) {  
                //UPDATE

                var l_container = angular.copy(container); 

                // update main entity
                var l_containerupdate = angular.copy(l_container); 
                delete l_containerupdate['photodocument'];   // delete fields not fitting to main object entity
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $rootScope.ApiAddress + "api/pcm_customer/" + l_containerupdate.id,
                    withCredentials: true,
                    method: 'PUT',
                    datatype: "json",
                    data: JSON.stringify(l_containerupdate)
                })
                    .then(function success(response) {
//                        $scope.loadData();  // refresh data if necessary (data could be changed by API)
                    }, function error(error) {
                            if (error.status == 401)
                                alert("Access Denied!!!")
                            else
                                alert("1: Unknown Error");
                            console.error('error', error);
                    });


                // update related entities 
                if (!l_container.photodocumentid) {
                    // create a new document

                    var l_photocontainer = angular.copy(l_container.photodocument); 
                    delete l_photocontainer['id'];
                    l_photocontainer.content = btoa(l_photocontainer.content);

                    var xjson = JSON.stringify(l_photocontainer);

                    //insert photodocument
                    $http({
                        headers: { "Content-Type": "application/json" },
                        url: $rootScope.ApiAddress + "api/doc_document",
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
                                url: $rootScope.ApiAddress + "api/pcm_customer/"+l_container.id,
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
                        url: $rootScope.ApiAddress + "api/doc_document/" + l_container.photodocumentid,
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

                var xjson = JSON.stringify(l_container);

                //INSERT
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $rootScope.ApiAddress + "api/pcm_customer",
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

    $scope.delete = function () {
        l_items = $rootScope.getSelectedRows($scope.customerlistid, $scope.pcm_customers);
        if (l_items.length == 0) {
            console.error('error', 'invalid number of records');
            return;
        }

        if (!confirm("Delete " + l_items.length + " records?"))
            return;

        angular.forEach(l_items, function (item, index) {

            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_customer/" + item.id,
                withCredentials: true,
                method: 'DELETE'
            })
                .then(function success(response) {
                    $scope.loadData();
                }, function error(error) {
                    if (error.status == 401)
                        alert("Access Denied!!!");
                    else
                        alert("6 Unknown Error!");
                    console.error('error', error);
                });
        });
    };

    $scope.selectedpcm_customer = null;

    $scope.refreshdetail = function () {
        $scope.selectedpcm_customer = null;

        l_selecteddata = $rootScope.getSelectedRows($scope.customerlistid, $scope.pcm_customers);
        if (l_selecteddata.length != 1) {
            return;
        }

        $scope.selectedpcm_customer = l_selecteddata[0];
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
