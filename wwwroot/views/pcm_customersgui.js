/**
 * pcm_customer list
 */
app.controller('pcm_customercontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert, ker_reference) {
    $scope.controllerName = 'pcm_customercontroller';
    $scope.multilineallowed = true;

    $scope.setparent = function (pLink) {
        if (!pLink.$parent)  // if there is no parent then set parent to null
            $scope.parent = null;
        else if (!pLink.$parent.controllerName) // if parent does not have a controllerName, then continue in the hierarchy
            $scope.setparent(pLink.$parent);
        else
            $scope.parent = pLink.$parent;
    }
    $scope.setparent($scope);
    if (!$scope.parent)
        $scope.parentControllerName = "";
    else
        $scope.parentControllerName = $scope.parent.controllerName;

  //  console.log("controllerName:", $scope.controllerName);
  //  console.log("parentControllerName:", $scope.parentControllerName);
  //  if ($scope.parent)
  //    console.log("parent:", $scope.parent.controllerName);


    $scope.getphoto = function (pIndex) {
        if (!$scope.pcm_customers[pIndex].id)  // customer does not exist
            $scope.pcm_customers[pIndex].photodocument = { "content": null, "url": null, "id": null };
        else
            if (!$scope.pcm_customers[pIndex].photodocumentid)  // customer picture does not exist
                $scope.pcm_customers[pIndex].photodocument = {"content":null, "url":null, "id":null};
            else {
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $rootScope.ApiAddress + "api/doc_document/" + $scope.pcm_customers[pIndex].photodocumentid,
                    withCredentials: true,
                    method: 'GET'
                })
                    .then(function success(response) {
                        $scope.pcm_customers[pIndex].photodocument = response.data;
                        $scope.pcm_customers[pIndex].photodocument.content = atob($scope.pcm_customers[pIndex].photodocument.content);  // transform json data from base-64 encoded string to raw string

                    }, function error(error) {
                            $rootScope.showerror($scope, 'getphoto', error); 
                            $scope.pcm_customers[pIndex].photodocument = { "content": null, "url": null, "id": null };
                    });
            }
    };

    $scope.loadData = function () {
        $scope.pcm_customers = null;
        $scope.selectedpcm_customer = null;
        $rootScope.resetSelection($rootScope.customerlistid);

        $http({
             headers: { "Content-Type": "application/json" },
             url: $rootScope.ApiAddress + "api/pcm_customer",
             withCredentials: true,
             method: 'GET'
        })
             .then(function success(response) {
                 $scope.pcm_customers = response.data;

                 $rootScope.resetSelection($rootScope.customerlistid);
                 angular.forEach($scope.pcm_customers, function (item, lIndex) {
                     item.index = lIndex;
                 });

             }, function error(error) {
                 $rootScope.showerror($scope, 'loadData', error); 
             });

    };

    $scope.new = function () {
        lData = { id: null };  // set id to null and other items to defaults
        $scope.detail(lData);
    }

    $scope.edit = function () {
        lData = $rootScope.getSelectedRows($scope.customerlistid, $scope.pcm_customers);
        if (lData.length != 1) {
            $rootScope.showalert("error", "Edit", "Select exactly one record!", "OK")
            return;
        }
        
        $scope.detail(lData[0]);
    };

    $scope.detail = function (pData) {

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/pcm_customeredit.html',
            controller: 'pcm_customereditcontroller',
            size: 'xl',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return pData;
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
                            $rootScope.showerror($scope, 'detail', error); 
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
                                        $rootScope.showerror($scope, 'detail.2', error);
                                });

                            $scope.loadData();
                        }, function error(error) {
                            $rootScope.showerror($scope, 'detail.3', error);
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
                            $rootScope.showerror($scope, 'detail.4', error);
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
                            $rootScope.showerror($scope, 'detail.5', error);
                    });
            }
        }, function () { /* cancel */ });
    };

    $scope.delete = function () {
        lItems = $rootScope.getSelectedRows($scope.customerlistid, $scope.pcm_customers);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Client(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Delete Client(s)", "Delete " + lItems.length + " records?"))
            return;

        angular.forEach(lItems, function (item, index) {

            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_customer/" + item.id,
                withCredentials: true,
                method: 'DELETE'
            })
                .then(function success(response) {
                    $scope.loadData();
                }, function error(error) {
                        $rootScope.showerror($scope, 'delete', error);
                });
        });
    };

    $scope.refreshdetail = function () {
        $scope.selectedpcm_customer = null;

        l_selecteddata = $rootScope.getSelectedRows($scope.customerlistid, $scope.pcm_customers);
        if (l_selecteddata.length != 1) {
            return;
        }

        $scope.selectedpcm_customer = l_selecteddata[0];
    };

    $scope.selectedpcm_customer = null;
    $scope.loadData();
    $rootScope.kerReftabInit();

});

app.controller('pcm_customereditcontroller', function ($scope, $uibModalInstance, container, $uibModal, $rootScope, ker_reference) {
    $scope.controllerName = 'pcm_customereditcontroller';
    
    $scope.setparent = function (pLink) {
        if (!pLink.$parent)  // if there is no parent then set parent to null
            $scope.parent = null;
        else if (!pLink.$parent.controllerName) // if parent does not have a controllerName, then continue in the hierarchy
            $scope.setparent(pLink.$parent);
        else
            $scope.parent = pLink.$parent;
    }
    $scope.setparent($scope);
    if (!$scope.parent)
        $scope.parentControllerName = "";
    else
        $scope.parentControllerName = $scope.parent.controllerName;

    
    $scope.currencylist = $rootScope.kerReftabGetList('CURRENCY');

    $scope.objectData = container;
    $scope.dataCopy = angular.copy($scope.objectData);


    $scope.pcm_customerpictureedit = function (pCustomer) {

        var modal2Instance = $uibModal.open({
            templateUrl: 'views/partials/pcm_customerpicture.html',
            controller: 'pcm_customerpicturecontroller',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return pCustomer;
                }
            }
        });

        modal2Instance.result.then(function (container) {
            /* ok */

        }, function () { /* cancel */ });
    };

    $scope.ok = function () {
        angular.forEach($scope.dataCopy, function (value, key) {
            $scope.objectData[key] = value;
        });

        $uibModalInstance.close($scope.objectData);
    };

    $scope.cancel = function () {        
        angular.forEach($scope.objectData, function (value, key) {
            $scope.dataCopy[key] = value;
        });

        $uibModalInstance.dismiss('cancel');
    };
});

app.controller('pcm_customerselectcontroller', function ($scope, $uibModalInstance, $rootScope, $http, guialert, multiline, multilineallowed, ker_reference) {   
    $scope.controllerName = 'pcm_customerselectcontroller';
    $scope.mulitilineallowed = multilineallowed;

    $scope.setparent = function (pLink) {
        if (!pLink.$parent)  // if there is no parent then set parent to null
            $scope.parent = null;
        else if (!pLink.$parent.controllerName) // if parent does not have a controllerName, then continue in the hierarchy
            $scope.setparent(pLink.$parent);
        else
            $scope.parent = pLink.$parent;
    }
    $scope.setparent($scope);
    if (!$scope.parent)
        $scope.parentControllerName = "";
    else
        $scope.parentControllerName = $scope.parent.controllerName;


    $scope.getphoto = function (pIndex) {
        if (!$scope.pcm_customers[pIndex].id)  // customer does not exist
            $scope.pcm_customers[pIndex].photodocument = { "content": null, "url": null, "id": null };
        else
            if (!$scope.pcm_customers[pIndex].photodocumentid)  // customer picture does not exist
                $scope.pcm_customers[pIndex].photodocument = { "content": null, "url": null, "id": null };
            else {
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $rootScope.ApiAddress + "api/doc_document/" + $scope.pcm_customers[pIndex].photodocumentid,
                    withCredentials: true,
                    method: 'GET'
                })
                    .then(function success(response) {
                        $scope.pcm_customers[pIndex].photodocument = response.data;
                        $scope.pcm_customers[pIndex].photodocument.content = atob($scope.pcm_customers[pIndex].photodocument.content);  // transform json data from base-64 encoded string to raw string

                    }, function error(error) {
                            $rootScope.showerror($scope, 'getphoto', error);
                            $scope.pcm_customers[pIndex].photodocument = { "content": null, "url": null, "id": null };
                    });
            }
    };

    $scope.loadData = function () {
        $scope.pcm_customers = null;
        $rootScope.resetSelection($rootScope.customerselectlistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_customer",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_customers = response.data;

                $rootScope.resetSelection($rootScope.customerselectlistid);
                angular.forEach($scope.pcm_customers, function (item, index) {
                    $scope.pcm_customers[index].index = index;
                    $scope.getphoto(index);

                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };

    $scope.ok = function () {
        lContainer = $rootScope.getSelectedRows($rootScope.customerselectlistid, $scope.pcm_customers);
        $uibModalInstance.close(lContainer);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.loadData();
    $rootScope.kerReftabInit();
});


app.controller('pcm_customerpicturecontroller', function ($scope, $uibModalInstance, container) {
    $scope.controllerName = 'pcm_customerpicturecontroller';

    $scope.setparent = function (pLink) {
        if (!pLink.$parent)  // if there is no parent then set parent to null
            $scope.parent = null;
        else if (!pLink.$parent.controllerName) // if parent does not have a controllerName, then continue in the hierarchy
            $scope.setparent(pLink.$parent);
        else
            $scope.parent = pLink.$parent;
    }
    $scope.setparent($scope);
    if (!$scope.parent)
        $scope.parentControllerName = "";
    else
        $scope.parentControllerName = $scope.parent.controllerName;


    $scope.objectData = container;
    $scope.dataCopy = angular.copy($scope.objectData);

    $scope.profileimage = function (pSelectimage) {
        var lSelectfile = pSelectimage.files[0];
        r = new FileReader();
        r.onloadend = function (e) {
            $scope.objectData.photodocument.content = e.target.result;
        }
        r.readAsDataURL(lSelectfile);
        $uibModalInstance.close($scope.objectData);
    }

    $scope.ok = function () {
        angular.forEach($scope.dataCopy, function (value, key) {
            $scope.objectData[key] = value;
        });

        $uibModalInstance.close($scope.objectData);
    };

    $scope.cancel = function () {
        angular.forEach($scope.objectData, function (value, key) {
            $scope.dataCopy[key] = value;
        });

        $uibModalInstance.dismiss('cancel');
    };
});
