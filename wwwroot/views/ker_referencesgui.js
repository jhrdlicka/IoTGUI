/**
 * ker_reference list
 */
app.controller('ker_referencecontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert) {
    $scope.controllerName = 'ker_referencecontroller';
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

    $scope.postimport = function (pIndex) {
        var item = $scope.ker_references[pIndex];
        $scope.ker_references[pIndex].index = pIndex;
    }

    $scope.loadData = function () {
        $scope.ker_references = null;
        $rootScope.resetSelection($rootScope.referencelistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reference",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.ker_references = response.data;

                $rootScope.resetSelection($rootScope.referencelistid);
                angular.forEach($scope.ker_references, function (item, lIndex) {
                    $scope.postimport(lIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };

    $scope.loadRecord = function (pIndex) {
        l_id = $scope.ker_references[pIndex].id;
        $scope.ker_references[pIndex] = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reference/" + l_id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.ker_references[pIndex] = response.data;
                $scope.postimport(pIndex);               
            }, function error(error) {
                $rootScope.showerror($scope, 'loadRecord', error);
            });

    };


    $scope.filterReftabs = function (item) {
        var dispreftabfield = document.getElementById('displayreftabs.' + $scope.parentControllerName);
        if (!dispreftabfield)
            return true;

        $scope.displayreftabs = dispreftabfield.value;

        if ($scope.displayreftabs == 'ALL') {
            return true;
        }

        if ($scope.parentControllerName == 'ker_reftabcontroller') {
            l_reftabs = $rootScope.getSelectedRows($rootScope.reftablistid, $scope.parent.ker_reftabs);
        }
        else
            if ($scope.parentControllerName == 'ker_reftabeditcontroller') {
                l_reftabs = {
                    reftab: {
                        reftabnm: $scope.parent.dataCopy.reftabnm
                    }
                };

            } else {
                l_reftabs = null;
            }


        l_result = false;
        angular.forEach(l_reftabs, function (reftab, index) {
            if (reftab.reftabnm == item.reftabnm) {
                //                console.log("found", item.id);
                l_result = true;
                return true;
            }
        }, function () { /* cancel */ });

        //if (!l_result)
        //  console.log("not found", item.id);
        //else 
        //  console.log("found", item.id);

        return l_result;
    };


    $scope.i_new = function (pReftab){
        // set id to null and other items to defaults
        var lData = {
            id: null, type: null, reftabnm: pReftab.reftabnm, namenm:null, name:null, description:null
        };

        $scope.detail(lData);
    }

    $scope.new = function () {
        var l_reftabs; 
        // get customer id and name to l_customers[0]
        if ($scope.parentControllerName == 'ker_reftabcontroller') {
            l_reftabs = $rootScope.getSelectedRows($rootScope.reftablistid, $scope.parent.ker_reftabs);
            if (l_reftabs.length != 1) {
                alert('Select exactly one Reference Table');
                console.error('error', 'invalid number of records');
                return;
            }
            $scope.i_new(l_reftabs[0]);
        }
        else
            if ($scope.parentControllerName == 'ker_reftabeditcontroller') {
                l_reftabs = [{
                    reftabnm: $scope.parent.dataCopy.reftabnm,
                }];
                $scope.i_new(l_reftabs[0]);
            } else { /* call customer lookup */
                $rootScope.entitySelect('ker_reftab', false).then(function (l_reftabs) {
                    $scope.i_new(l_reftabs[0]);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "New Reference", "No reftab selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'new', error);
                });
            };
    }

    $scope.edit = function () {
        lData = $rootScope.getSelectedRows($scope.referencelistid, $scope.ker_references);
        if (lData.length != 1) {
            $rootScope.showalert("error", "Edit", "Select exactly one record!", "OK")
            return;
        }

        $scope.detail(lData[0]);
    };


    $scope.save = function (container) {

        container.type = parseInt(container.type);
            
        var l_container = angular.copy(container); 

        if (container.id) {
            //UPDATE

            // update main entity
            var l_containerupdate = angular.copy(l_container);
            // delete l_containerupdate['photodocument'];   // delete fields not fitting to main object entity
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/ker_reference/" + l_containerupdate.id,
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
                url: $rootScope.ApiAddress + "api/ker_reference",
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
            templateUrl: 'views/partials/ker_referenceedit.html',
            controller: 'ker_referenceeditcontroller',
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
        lItems = $rootScope.getSelectedRows($scope.referencelistid, $scope.ker_references);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Reference Item(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Delete Reference Item(s)", "Delete " + lItems.length + " records?"))
            return;
        var promise1 = function () {
            var promises = [];
            angular.forEach(lItems, function (item, index) {

                var promise2 = $http({
                    headers: { "Content-Type": "application/json" },
                    url: $rootScope.ApiAddress + "api/ker_reference/" + item.id,
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


    if ($scope.parentControllerName == "ker_reftabeditcontroller")
        $scope.displayreftabs = "SELECTED";
    else if ($scope.parentControllerName == "ker_reftabcontroller")
        $scope.displayreftabs = "SELECTED";
    else
        $scope.displayreftabs = "ALL";
    $scope.displayreftabsoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED", Text: "Connected to seleted tables" },
    ];

    $scope.loadData();

});

app.controller('ker_referenceeditcontroller', function ($scope, $uibModalInstance, container, $uibModal) {
    $scope.controllerName = 'ker_referenceeditcontroller';

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

app.controller('ker_referenceselectcontroller', function ($scope, $uibModalInstance, $rootScope, $http, guialert, multiline, multilineallowed) {   
    $scope.controllerName = 'ker_referenceselectcontroller';
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

    //console.log("controllerName:", $scope.controllerName);
    //console.log("parentControllerName:", $scope.parentControllerName);
    //console.log("parent:", $scope.parent.controllerName);


    $scope.postimport = function (pIndex) {
        var item = $scope.ker_references[pIndex];
        $scope.ker_references[pIndex].index = pIndex;
    }

    $scope.loadData = function () {
        $scope.ker_references = null;
        $rootScope.resetSelection($rootScope.referenceselectlistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reference",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.ker_references = response.data;

                $rootScope.resetSelection($rootScope.referenceselectlistid);
                angular.forEach($scope.ker_references, function (item, lIndex) {
                    $scope.postimport(lIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };

    $scope.filterReftabs = function (item) {
        var dispreftabfield = document.getElementById('displayreftabs.' + $scope.parentControllerName);
        if (!dispreftabfield)
            return true;

        $scope.displayreftabs = dispreftabfield.value;

        if ($scope.displayreftabs == 'ALL') {
            return true;
        }
        if ($scope.displayreftabs == 'ANY') {
            if (!item.reftabnm)
                return false;
            else
                return true;
        }
        if ($scope.displayreftabs == 'NULL') {
            if (!item.reftabnm)
                return true;
            else
                return false;
        }
    };


    $scope.ok = function () {
        lContainer = $rootScope.getSelectedRows($rootScope.referenceselectlistid, $scope.ker_references);
        $uibModalInstance.close(lContainer);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.displayreftabs = "ALL";
    $scope.displayreftabsoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "ANY", Text: "Connected to any table" },
        { Value: "NULL", Text: "Not connected to tables" }
    ];

    $scope.loadData();



});

