/**
 * ker_reftab list
 */
app.controller('ker_reftabcontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert) {
    $scope.controllerName = 'ker_reftabcontroller';
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

//    console.log("controllerName:", $scope.controllerName);
//    console.log("parentControllerName:", $scope.parentControllerName);
//    if ($scope.parent)
//      console.log("parent:", $scope.parent.controllerName);



    $scope.getreferences = function (pIndex) {
        var lId = $scope.ker_reftabs[pIndex].id;
        if (!$scope.ker_reftabs[pIndex].reftabnm) {
            console.log("reftabnm missing:", pIndex, $scope.ker_reftabs);
            return;
        }
            

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reference/reftabnm/" + $scope.ker_reftabs[pIndex].reftabnm,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                if (!$scope.ker_reftabs || !$scope.ker_reftabs[pIndex] || $scope.ker_reftabs[pIndex].id != lId) {
                    //                    console.log("invalid pointer - probably double refresh (4)", caleventindex, $scope.ker_reftabs);
                    return;
                }

                $scope.ker_reftabs[pIndex].references = response.data;

            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    //                    alert("Unknown Error!");
                    console.error('error', error);
                    $scope.ker_reftabs[pIndex].references = null;
            });
    };

    $scope.postImport = function (pIndex) {

        $scope.ker_reftabs[pIndex].index = pIndex;
        $scope.getreferences(pIndex);
    }

    $scope.loadData = function () {
        $scope.ker_reftabs = null;
        $rootScope.resetSelection($rootScope.reftablistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reftab",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                var lData = response.data;
                $scope.ker_reftabs = lData;

                $rootScope.resetSelection($rootScope.reftablistid);    
                angular.forEach($scope.ker_reftabs, function (item, lIndex) {
                    $scope.postImport(lIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };

    $scope.loadRecord = function (pIndex) {
        l_id = $scope.ker_reftabs[pIndex].id;
        $scope.ker_reftabs[pIndex] = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reftab/" + l_id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                var lData = response.data;
                $scope.ker_reftabs[pIndex] = lData;

                $scope.postImport(pIndex);               
            }, function error(error) {
                $rootScope.showerror($scope, 'loadRecord', error);
            });

    };




    $scope.new = function (){
        // set id to null and other items to defaults
        var lData = {
            id: null, type: null, reftabnm: null, description: null
        };

        $scope.detail(lData);
    }

    $scope.edit = function () {
        lData = $rootScope.getSelectedRows($scope.reftablistid, $scope.ker_reftabs);
        if (lData.length != 1) {
            $rootScope.showalert("error", "Edit", "Select exactly one record!", "OK")
            return;
        }

        $scope.detail(lData[0]);
    };


    $scope.save = function (container) {

        container.type = parseInt(container.type);
            
        var l_container = angular.copy(container); 
        if (l_container.references)
            delete l_container['references'];

        if (container.id) {
            //UPDATE

            // update main entity
            var l_containerupdate = angular.copy(l_container);
            // delete l_containerupdate['photodocument'];   // delete fields not fitting to main object entity
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/ker_reftab/" + l_containerupdate.id,
                withCredentials: true,
                method: 'PUT',
                datatype: "json",
                data: JSON.stringify(l_containerupdate)
            })
                .then(function success(response) {
                    $scope.loadRecord(container.index);                    
                    //                        $scope.loadData();  // refresh data if necessary (data could be changed by API)
                }, function error(error) {
                    $rootScope.showerror($scope, 'save.update', error);
                });


        }
        else {
            // create a container without "id" field
            delete l_container['id'];

            var xjson = JSON.stringify(l_container);

            //INSERT
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/ker_reftab",
                withCredentials: true,
                method: 'POST',
                datatype: "json",
                data: xjson
            })
                .then(function success(response) {
                    $scope.loadData();
                }, function error(error) {
                    $rootScope.showerror($scope, 'save.insert', error);
                });
        }

    }

    $scope.detail = function (pData) {

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/ker_reftabedit.html',
            controller: 'ker_reftabeditcontroller',
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
            $scope.save(container)
        }, function () { /* cancel */ });
    };

    $scope.delete = function () {
        lItems = $rootScope.getSelectedRows($scope.reftablistid, $scope.ker_reftabs);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Reference table(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Reference table(s)", "Delete " + lItems.length + " records?"))
            return;
        var promise1 = function () {
            var promises = [];
            angular.forEach(lItems, function (item, index) {

                var promise2 = $http({
                    headers: { "Content-Type": "application/json" },
                    url: $rootScope.ApiAddress + "api/ker_reftab/" + item.id,
                    withCredentials: true,
                    method: 'DELETE'
                })
                    .then(function success(response) {
                        return response.$promise
                    }, function error(error) {
                        $rootScope.showerror($scope, 'delete', error);
                    });
                promises.push(promise2);
            });
            return $q.all(promises);
        }

        promise1().then(function (promiseArray) {
            $scope.loadData();
        });     
    };

    $scope.loadData();
});

app.controller('ker_reftabeditcontroller', function ($scope, $uibModalInstance, container, $uibModal) {
    $scope.controllerName = 'ker_reftabeditcontroller';

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

app.controller('ker_reftabselectcontroller', function ($scope, $uibModalInstance, $rootScope, $http, guialert, multiline, multilineallowed) {   
    $scope.controllerName = 'ker_reftabselectcontroller';
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


    $scope.getreferences = function (pIndex) {
        var lId = $scope.ker_reftabs[pIndex].id;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reference/reftabnm/" + $scope.ker_reftabs[pIndex].reftabnm,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                if (!$scope.ker_reftabs || !$scope.ker_reftabs[pIndex] || $scope.ker_reftabs[pIndex].id != lId) {
                    //                    console.log("invalid pointer - probably double refresh (4)", caleventindex, $scope.ker_reftabs);
                    return;
                }

                $scope.ker_reftabs[pIndex].references = response.data;

            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    //                    alert("Unknown Error!");
                    console.error('error', error);
                $scope.ker_reftabs[pIndex].references = null;
            });
    };

    $scope.postImport = function (pIndex) {
        $scope.ker_reftabs[pIndex].index = pIndex;
        $scope.getreferences(pIndex);
    }


    $scope.loadData = function () {
        $scope.ker_reftabs = null;
        $rootScope.resetSelection($rootScope.reftabselectlistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reftab",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                var lData = response.data;
                $scope.ker_reftabs = lData;

                $rootScope.resetSelection($rootScope.reftabselectlistid);
                angular.forEach($scope.ker_reftabs, function (item, lIndex) {
                    $scope.postImport(lIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };


    $scope.ok = function () {
        lContainer = $rootScope.getSelectedRows($rootScope.reftabselectlistid, $scope.ker_reftabs);
        $uibModalInstance.close(lContainer);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.loadData();



});

