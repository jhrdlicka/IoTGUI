/**
 * ker_reference list
 */

app.service('model_ker_reference', function ($rootScope, $http, serverUpdateHub, model_ker_reftab) {
    $rootScope.model_ker_reference = { packageName: 'model_ker_reference' };
    var myscope = $rootScope.model_ker_reference;

    $rootScope.model_ker_reference.loaded = false;
    $rootScope.model_ker_reference.loading = false;


    function indexReftab(pItem) {
        //$rootScope.log(myscope, 'indexReftab', "pItem: ", pItem, null, null);
        if (!pItem.reftabnm) {
            pItem.xreftab = null;
            return;
        }

        if (pItem.xreftab && (pItem.xreftab.reftabnm == pItem.reftabnm))
            return;

        pItem.xreftab = $rootScope.ker_reftabs.find(i => i.reftabnm == pItem.reftabnm);
        if (!pItem.xreftab) {
            // item not found in the collection
            // call add_new_item and connect it to the new one
            // or raise an error
            $rootScope.showerror(myscope, 'indexDevice', null);
        }

        if (!pItem.xreftab.xreferences)
            pItem.xreftab.xreferences = [];
        pItem.xreftab.xreferences.push(pItem);
    };

    function indexReftabs() {
        angular.forEach($rootScope.ker_references, function (lItem, lIndex) {
            indexReftab(lItem);
        });
    };


    $rootScope.model_ker_reference.serverUpdateHubMsgResolve = function (pMessage) {
        $rootScope.log(myscope, 'loadData', "received SignalR message: ", pMessage, null, null);
        //            $rootScope.showtoast("info", pMessage, "received SignalR message: ");
        var lMsg = JSON.parse(pMessage);

        var lIndex;
        var lItem;

        if ((lMsg.operationtxt == "insert") || (lMsg.operationtxt == "update")) {
            if (lMsg.operationtxt == "insert")
                $rootScope.log(myscope, 'SignalR', "A new item created", null, pMessage, "info");
            else if (lMsg.operationtxt == "update")
                $rootScope.log(myscope, 'SignalR', "An item updated", null, pMessage, "info");

            lItem = $rootScope.ker_references.find(i => i.id == lMsg.id);
            if (lItem === undefined) {
                if (lMsg.operationtxt == "update") {
                    $rootScope.showerror(myscope, 'loadData', {
                        status: 500, statusText: 'UpdatedRecordNotFound: ' + lMsg.id
                    });
                }
                lIndex = $rootScope.ker_references.push({ id: lMsg.id }) - 1;
                $rootScope.ker_references[lIndex].index = lIndex;
            }
            else
                lIndex = lItem.index;
            $rootScope.model_ker_reference.loadRecord(lIndex);
        };

        if (lMsg.operationtxt == "delete") {
            $rootScope.log(myscope, 'SignalR', "An item deleted", null, pMessage, "info");
            lItem = $rootScope.ker_references.find(i => i.id == lMsg.id);
            if (lItem === undefined) {
                $rootScope.showerror(myscope, 'loadData', {
                    status: 500, statusText: 'DeletedRecordNotFound: ' + lMsg.id
                });
                return;
            }
            /*
            if (
                (lItem.xreferences && lItem.xreferences.length > 0)
                //                || (lItem.xsamples && lItem.xsamples.length > 0) 
                //                || (lItem.xtasks && lItem.xtasks.length > 0)
            ) {
                $rootScope.showerror(myscope, 'loadData', {
                    status: 500, statusText: "DeletedRecordContainsSubrecords: " + lItem.id
                });
                return;
            }
            */

            $rootScope.ker_references.splice(lItem.index, 1);
            for (lIndex = lItem.index; lIndex < $rootScope.ker_references.length; lIndex++)
                $rootScope.ker_references[lIndex].index = lIndex;
            if ($rootScope.ker_references.length > 0)
                $rootScope.model_ker_reference.loadRecord(0);   // reload any record to refresh the view
            else
                $rootScope.ker_references = null;
        };
    }

    $rootScope.model_ker_reference.postImport = function (pIndex) {
        var lItem = $rootScope.ker_references[pIndex];
        lItem.index = pIndex;
        // add another calculations
        //lItem.timestamp = lItem.timestamp + "Z";
        //lItem.timestamptime = new Date(lItem.timestamp);
    };

    $rootScope.model_ker_reference.loadData = function (pForce) {
        if ($rootScope.model_ker_reference.loaded) {
            if (!pForce)  // avoid double-loading
                return;
            else {
                // delete all relations to the entity from the model - data are fe-fetched from the database;             
                
                angular.forEach($rootScope.ref_reftab, function (lItem, lIndex) {
                    lItem.xreferences = [];
                });
                /*
                angular.forEach($rootScope.iot_calendardays, function (lItem, lIndex) {
                    lItem.xsamples = [];
                });

                */                
            }
        };
        if ($rootScope.model_ker_reference.loading) {
            return;
        };

        $rootScope.model_ker_reference.loading = true;

        $rootScope.ker_references = null;

        // initialize SignalR incremental updates
        $rootScope.serverUpdateHub.init();
        $rootScope.serverUpdateHub.connection.on("ker_reference", function (pMessage) { $rootScope.model_ker_reference.serverUpdateHubMsgResolve(pMessage) });


        $rootScope.log(myscope, 'loadData', "start loading reference items", null, null, "info");
        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reference",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.ker_references = response.data;
                angular.forEach($rootScope.ker_references, function (item, lIndex) {
                    $rootScope.model_ker_reference.postImport(lIndex);
                });

                // load master table(s) and create relations
                
                if ($rootScope.model_ker_reftab.loaded) {
                    $rootScope.log(myscope, 'loadData', "model_ker_reftab.has already been loaded", null, null, "info");
                    indexReftabs();
                }
                else {
                    $rootScope.$on('model_ker_reftab.loaded', function () {
                        $rootScope.log(myscope, 'loadData', "model_ker_reftab loaded", null, null, "success");
                        indexReftabs();
                    });
                    $rootScope.model_ker_reftab.loadData(false);
                }

                
                /*
                if ($rootScope.model_iot_calendarday.loaded) {
                    $rootScope.log(myscope, 'loadData', "model_iot_calendarday.has already been loaded", null, null, "info");
                    indexCalendardays();
                }
                else{
                    $rootScope.$on('model_iot_calendarday.loaded', function () {
                        $rootScope.log(myscope, 'loadData', "model_iot_calendarday loaded", null, null, "success");
                        indexCalendardays();
                    });
                    $rootScope.model_iot_calendarday.loadData(false);
                }
                    */

                $rootScope.model_ker_reference.loaded = true;
                $rootScope.model_ker_reference.loading = false;
                $rootScope.$broadcast('model_ker_reference.loaded');
                $rootScope.log(myscope, 'loadData', "reference tables loaded and indexed", $rootScope.ker_references, null, "success");

            }, function error(error) {
                $rootScope.showerror(myscope, 'loadData', error);
                $rootScope.model_ker_reference.loading = false;
            });
    };

    $rootScope.model_ker_reference.loadRecord = function (pIndex) {
        var lItem = $rootScope.ker_references[pIndex];
        var lId = lItem.id;

        
        if (lItem.xreftab)
            // remove the record from list of samples
            angular.forEach(lItem.xreftab.xreferences, function (child, childindex) {
                if (child.id == lId) {
                    lItem.xreftab.xreferences.splice(childindex, 1); // remove sample from array
                }
            });
            

        // save subitems
        //var lxreferences = lItem.xreferences;
        //var lxtasks = $rootScope.iot_devices[pIndex].xtasks;
        //var lxsamples = $rootScope.iot_devices[pIndex].xsamples;

        //$rootScope.ker_references[pIndex] = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reference/" + lId,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.ker_references[pIndex] = response.data;
                // restore subitems
                //$rootScope.iot_devices[pIndex].xreferences = lxreferences;
                //$rootScope.iot_devices[pIndex].xtasks = lxtasks;
                //$rootScope.iot_devices[pIndex].xsamples = lxsamples;

                $rootScope.model_ker_reference.postImport(pIndex);
                // index master-object
                 indexReftab($rootScope.ker_references[pIndex]);
                //                indexCalendarday($rootScope.ker_references[pIndex]);
            }, function error(error) {
                $rootScope.showerror(myscope, 'loadRecord', error);
            });
    };

    $rootScope.model_ker_reference.save = function (container) {

        var l_container = angular.copy(container);

        l_container.type = parseInt(l_container.type);
        /*
                if (!l_container.masterdeviceid)
                    if (l_container.xmasterdevice)
                        l_container.masterdeviceid = l_container.xmasterdevice.id;
                        */

        // delete fields not fitting to main object entity
        if (l_container.xreferences)
            delete l_container['xreferences'];
        /*
        if (l_container.xsubdevices)
            delete l_container['xsubdevices'];
        if (l_container.xtasks)
            delete l_container['xtasks'];
        if (l_container.xsamples)
            delete l_container['xsamples'];
            */

        /*
                if (l_container.accepteddate)
                    l_container.accepted = l_container.accepteddate.toJSON();
                else
                    l_container.accepted = null;

                if (l_container.duedate)
                    l_container.due = l_container.duedate.toJSON();
                else
                    l_container.due = null;

                    */

        if (l_container.id) {
            //UPDATE

            // update main entity
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/ker_reference/" + l_container.id,
                withCredentials: true,
                method: 'PUT',
                datatype: "json",
                data: JSON.stringify(l_container)
            })
                .then(function success(response) {
                    //
                }, function error(error) {
                    $rootScope.showerror(myscope, 'save.update', error);
                });


        }
        else {
            delete l_container['id'];

            //INSERT
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/ker_reference",
                withCredentials: true,
                method: 'POST',
                datatype: "json",
                data: JSON.stringify(l_container)
            })
                .then(function success(response) {
                    //
                }, function error(error) {
                    $rootScope.showerror(myscope, 'save.insert', error);
                });
        }
    }


    $rootScope.model_ker_reference.delete = function (pItems) {

        angular.forEach(pItems, function (item, index) {
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/ker_reference/" + item.id,
                withCredentials: true,
                method: 'DELETE'
            })
                .then(function success(response) {
                    //
                }, function error(error) {
                    $rootScope.showerror(myscope, 'delete', error);
                });
        });
    };

});

app.controller('ker_referencecontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert, model_ker_reference, $route) {
    $scope.entity = 'ker_reference';
    $scope.controllerName = $scope.entity + 'controller';
    $scope.packageName = $scope.controllerName;
    var myscope = $scope;

    if ($scope.$resolve && $scope.$resolve.mode)  // take mode from calling of the modal
        $scope.mode = $scope.$resolve.mode;
    else
        $scope.mode = ($route.current.mode ? $route.current.mode : "list");   // take mode from route or use default

    if ($scope.mode == "select") {
        $scope.multilineallowed = $scope.$resolve.multilineallowed;
        $scope.instance = $scope.$resolve.instance;
    }
    else {
        $scope.multilineallowed = ($route.current.multilineallowed ? $route.current.multilineallowed : true);  // take multilineallowed from route or use default
    }

    $scope.id = $scope.$id; // to identify inherited values

    // register multiline lists and initiate multiline structures
    $scope.listid = $rootScope.lastlistid++;
    $rootScope.selectedRowsIndexes[$scope.listid] = [];

    /*
    $rootScope.log(myscope, 'init', "New controller", $scope.controllerName + ": " + $scope.id, null, null);                    
    $rootScope.log(myscope, 'init', "mode", $scope.mode, null, null);                    
    $rootScope.log(myscope, 'init', "multilineallowed", $scope.multilineallowed, null, null);                    
    $rootScope.log(myscope, 'init', "instance", $scope.instance, null, null);                    
    */

    $scope.setparent = function (pLink) {
        if (!pLink.$parent)  // if there is no parent then set parent to null
            $scope.parent = null;
        else if (!pLink.$parent.controllerName) // if parent does not have a controllerName, then continue in the hierarchy
            $scope.setparent(pLink.$parent);
        else {
            $scope.parent = pLink.$parent;
            if (!pLink.$parent.id || pLink.$parent.id != pLink.$parent.$id) {  // if controllerName is derived 
                $scope.setparent(pLink.$parent);
            }
            if ($scope.parent && ($scope.parent.$$watchers.length == 0)) {   // if controller is empty
                $scope.setparent(pLink.$parent);
            }
        }
    }
    $scope.setparent($scope);
    if (!$scope.parent)
        $scope.parentControllerName = "";
    else
        $scope.parentControllerName = $scope.parent.controllerName;

    /*
    console.log("parent", $scope.parent);
    console.log("parentControllerName", $scope.parentControllerName);
    console.log("listid", $scope.listid);
    console.log("parent watchers", $scope.parent ? $scope.parent.$$watchers.length : 0)
    */


    // pagination defaults
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.itemsPerPage = $rootScope.itemsPerPage;
    $scope.maxSize = $rootScope.maxSize; //Number of pager buttons to show


    $scope.calcTotalItems = function (pFilteredDataLength) {
        $scope.totalItems = pFilteredDataLength;
        return null;
    }

    $scope.testEmptyTable = function (pTableID) {

        //$scope.currentPage = pCurrentPage;
        var myTab = document.getElementById(pTableID);
        if (!myTab) {
            //$rootScope.log(myscope, 'testEmptyTable', 'testEmptyTable: ' + pTableID, null, null, 'error');
            return null;
        }

        var lItems = myTab.rows.length - 1;
        //$rootScope.log(myscope, 'testEmptyTable', 'testEmptyTable: ' + lItems, null, null, 'info');
        if (lItems == 0)
            $scope.totalItems = 0;
    }


    $scope.pageChanged = function (pCurrentPage) {
        $scope.currentPage = pCurrentPage;
        //$rootScope.log(myscope, 'pageChanged', 'Page changed to: '+ $scope.currentPage, null, null, 'info');                    
    };


    $scope.loadData = function (pForce) {
        $rootScope.resetSelection($scope.listid);
        $rootScope.model_ker_reference.loadData(pForce);
    };


    $rootScope.$watchCollection($scope.entity + "s", function () {
        $rootScope.log(myscope, "$watchCollection", "*** data changed ***", null, null, "info");
        $rootScope.checkSelectedRows($scope.listid, $rootScope.ker_references);
    }, true);


    $scope.filterReftabs = function (item) {
        var dispreftabfield = document.getElementById('displayreftabs.' + $scope.listid);
        if (!dispreftabfield)
            return true;

        $scope.displayreftabs = dispreftabfield.value;

        if ($scope.displayreftabs == 'ALL') {
            return true;
        }

        if ($scope.parentControllerName == 'ker_reftabcontroller') {
            l_reftabs = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.ker_reftabs);
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

    $scope.new = function (pReftab) {
        var l_reftabs; 
        // get reftabnm, name, and reftabnm to l_reftabs[0]
        if (pReftab) {
            l_reftabs = [{
                id: pReftab.id,
                name: pReftab.name,
                reftabnm: pReftab.reftabnm
            }];
            $scope.i_new(l_reftabs[0]);
        }
        else 
        if ($scope.parentControllerName == 'ker_reftabcontroller') {
            l_reftabs = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.ker_reftabs);
            if (l_reftabs.length != 1) {
                $rootScope.showalert("error", "New Reference", "Select exactly one Refererence table", "OK");
                $rootScope.showerror($scope, 'new.1', 'invalid number of records');
                return;
            }
            $scope.i_new(l_reftabs[0]);
        }
        else
            if ($scope.parentControllerName == 'ker_reftabeditcontroller') {
                l_reftabs = [{
                    reftabnm: $scope.parent.dataCopy.reftabnm,
                    id: $scope.parent.dataCopy.id,
                    name: $scope.parent.dataCopy.name,
                }];
                $scope.i_new(l_reftabs[0]);
            } else {

                // use only if the deviceid is mandatory
                // call customer lookup 
                $rootScope.entitySelect('ker_reftab', false).then(function (l_reftabs) {
                    $scope.i_new(l_reftabs[0]);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "New Reference", "No reftab selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'new', error);

                });

                // use only if the deviceid is NOT mandatory
                //$scope.i_new(null);           
            };
    }

    $scope.edit = function () {
        lData = $rootScope.getSelectedRows($scope.listid, $rootScope.ker_references);
        if (lData.length != 1) {
            $rootScope.showalert("error", "Edit", "Select exactly one record!", "OK")
            return;
        }

        $scope.detail(lData[0]);
    };   

    $scope.detail = function (pData) {

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/' + $scope.entity + 'edit.html',
            controller: $scope.entity + 'editcontroller',
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
            $rootScope.model_ker_reference.save(container)
        }, function () { /* cancel */ });

    };


    $scope.delete = function () {
        lItems = $rootScope.getSelectedRows($scope.listid, $rootScope.ker_references);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Reference table(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Delete Reference table(s)", "Delete " + lItems.length + " records?"))
            return;

        $rootScope.model_ker_reference.delete(lItems);
    };

    $scope.ok = function () {
        var lContainer = $rootScope.getSelectedRows($scope.listid, $rootScope.ker_references);
        $rootScope.modalInstance[$scope.instance].close(lContainer);
    };

    $scope.cancel = function () {
        $rootScope.modalInstance[$scope.instance].dismiss('cancel');
    };

    if ($scope.parentControllerName == "ker_reftabeditcontroller")
        $scope.displayreftabs = "SELECTED";
    else if ($scope.parentControllerName == "ker_reftabcontroller")
        $scope.displayreftabs = "SELECTED";
    else
        $scope.displayreftabs = "ALL";
    $scope.displayreftabsoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED", Text: "Connected to selected tables" },
    ];

    $scope.loadData(false);
    //$rootScope.kerReftabInit();

});

app.controller('ker_referenceeditcontroller', function ($scope, $uibModalInstance, container, $uibModal, $rootScope, ker_reference) {
    $scope.entity = 'ker_reference';
    $scope.controllerName = $scope.entity + 'editcontroller';
    $scope.packageName = $scope.controllerName;
    var myscope = $scope;
    $scope.id = $scope.$id; // to identify inherited values

    $scope.setparent = function (pLink) {
        if (!pLink.$parent)  // if there is no parent then set parent to null
            $scope.parent = null;
        else if (!pLink.$parent.controllerName) // if parent does not have a controllerName, then continue in the hierarchy
            $scope.setparent(pLink.$parent);
        else {
            $scope.parent = pLink.$parent;
            if (!pLink.$parent.id || pLink.$parent.id != pLink.$parent.$id) {  // if controllerName is derived 
                $scope.setparent(pLink.$parent);
            }
            if ($scope.parent && ($scope.parent.$$watchers.length == 0)) {   // if controller is empty
                $scope.setparent(pLink.$parent);
            }
        }
    }
    $scope.setparent($scope);
    if (!$scope.parent)
        $scope.parentControllerName = "";
    else
        $scope.parentControllerName = $scope.parent.controllerName;

    /*
    $scope.devicecategorylist = $rootScope.kerReftabGetList('DEVICECATEGORY');

    $scope.devicetypelist = $rootScope.kerReftabGetList('DEVICETYPE');

    $scope.unitlist = $rootScope.kerReftabGetList('UNIT');
     });

    */

    $scope.objectData = container;
    $scope.dataCopy = angular.copy($scope.objectData);

    /*
     // initialize datapickers for dates
    $scope.popupaccepted = { opened: false }; // initialize datapicker for fromdate
    $scope.popupdue = { opened: false }; // initialize datapicker for fromdate
    */


    $scope.ok = function () {

        // validate fields
        var elements = document.getElementById("myForm").elements;
        var lErr = false;
        for (var i = 0, element; element = elements[i++];) {
            if (element.required && /*element.type === "text" &&*/ element.value === "") {
                //$rootScope.log(myscope, 'ok', "Madatory filed", element.name, element, null);
                $rootScope.showtoast("error", "Madatory filed :" + element.name, null, element);
                lErr = true;
            }
        }
        if (lErr)
            return;

        // !!!
        // vyzkouset tady zavolat
        //$rootScope.model_ker_reference.save(container)
        // misto v listcontroleru - detail
        // a podle vysledku zavrit detail, nebo se vratit k editovani

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

    /*
    // open datapickers for dates
    $scope.openaccepted = function () { // open datapicker for fromdate
        $scope.popupaccepted.opened = true;
    };
    $scope.opendue = function () { // open datapicker for fromdate
        $scope.popupdue.opened = true;
    };
    */


});
