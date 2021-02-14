/**
 * iot_sample list
 */

app.service('model_iot_sample', function ($rootScope, $http, serverUpdateHub) {
    $rootScope.model_iot_sample = { packageName: 'model_iot_sample' };
    var myscope = $rootScope.model_iot_sample;

    $rootScope.model_iot_sample.loaded = false;
    $rootScope.model_iot_sample.loading = false;

    function indexDevice(pItem) {
        if (!pItem.deviceid) {
            pItem.xdevice = null;
            return;
        }

        if (pItem.xdevice && (pItem.xdevice.id == pItem.deviceid))
            return;

        pItem.xdevice = $rootScope.iot_devices.find(dev => dev.id == pItem.deviceid);
        if (!pItem.xdevice) {
            // item not found in the collection
            // call add_new_item and connect it to the new one
            // or raise an error
            $rootScope.showerror(myscope, 'indexDevice', null);
        }

        if (!pItem.xdevice.xsamples)
            pItem.xdevice.xsamples = [];
        pItem.xdevice.xsamples.push(pItem);
    };

    function indexDevices() {
        angular.forEach($rootScope.iot_samples, function (lItem, lIndex) {
            indexDevice(lItem);
        });
    };

    $rootScope.model_iot_sample.serverUpdateHubMsgResolve = function (pMessage) {
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

            lItem = $rootScope.iot_samples.find(i => i.id == lMsg.id);
            if (lItem === undefined) {
                if (lMsg.operationtxt == "update") {
                    $rootScope.showerror(myscope, 'loadData', {
                        status: 500, statusText: 'UpdatedRecordNotFound: ' + lMsg.id
                    });
                }
                lIndex = $rootScope.iot_samples.push({ id: lMsg.id }) - 1;
                $rootScope.iot_samples[lIndex].index = lIndex;
            }
            else
                lIndex = lItem.index;
            $rootScope.model_iot_sample.loadRecord(lIndex);
        };

        if (lMsg.operationtxt == "delete") {
            $rootScope.log(myscope, 'SignalR', "An item deleted", null, pMessage, "info");
            lItem = $rootScope.iot_samples.find(i => i.id == lMsg.id);
            if (lItem === undefined) {
                $rootScope.showerror(myscope, 'loadData', {
                    status: 500, statusText: 'DeletedRecordNotFound: ' + lMsg.id
                });
                return;
            }

            /*
            if (
                (lItem.xsubdevices && lItem.xsubdevices.length > 0) ||
                (lItem.xsamples && lItem.xsamples.length > 0) ||
                (lItem.xtasks && lItem.xtasks.length > 0)
            ) {
                $rootScope.showerror(myscope, 'loadData', {
                    status: 500, statusText: "DeletedRecordContainsSubrecords: " + lItem.id
                });
                return;
            }
            */

            $rootScope.iot_samples.splice(lItem.index, 1);
            for (lIndex = lItem.index; lIndex < $rootScope.iot_samples.length; lIndex++)
                $rootScope.iot_samples[lIndex].index = lIndex;
            if ($rootScope.iot_samples.length > 0)
                $rootScope.model_iot_sample.loadRecord(0);   // reload any record to refresh the view
            else
                $rootScope.iot_samples = null;
        };
    }

    $rootScope.model_iot_sample.postImport = function (pIndex) {
        var lItem = $rootScope.iot_samples[pIndex];
        lItem.index = pIndex;
        // add another calculations
        lItem.timestamp = lItem.timestamp + "Z";
        lItem.timestamptime = new Date(lItem.timestamp);  
    };

    $rootScope.model_iot_sample.loadData = function (pForce) {
        if ($rootScope.model_iot_sample.loaded) {
            if (!pForce)  // avoid double-loading
                return;
            else {
                // delete all relations to the entity from the model - data are fe-fetched from the database;             
                angular.forEach($rootScope.iot_devices, function (lItem, lIndex) {
                    lItem.xsamples = [];
                });
                angular.forEach($rootScope.iot_calendardays, function (lItem, lIndex) {
                    lItem.xsamples = [];
                });
            }
        };
        if ($rootScope.model_iot_sample.loading) {
            return;
        };

        $rootScope.model_iot_sample.loading = true;

        $rootScope.iot_samples = null;

        // initialize SignalR incremental updates
        $rootScope.serverUpdateHub.init();
        $rootScope.serverUpdateHub.connection.on("iot_sample", function (pMessage) { $rootScope.model_iot_sample.serverUpdateHubMsgResolve(pMessage) });


        $rootScope.log(myscope, 'loadData', "start loading samples", null, null, "info");
        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_sample",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_samples = response.data;
                $rootScope.log(myscope, 'loadData', "start indexing samples", null, null, "info");
                angular.forEach($rootScope.iot_samples, function (item, lIndex) {
                    $rootScope.model_iot_sample.postImport(lIndex);
                });

                // load master table(s) and create relations
                if ($rootScope.model_iot_device.loaded) {
                    $rootScope.log(myscope, 'loadData', "model_iot_device.has already been loaded", null, null, "info");
                    indexDevices();
                }
                else {
                    $rootScope.$on('model_iot_device.loaded', function () {
                        $rootScope.log(myscope, 'loadData', "model_iot_device.loaded", null, null, "success");
                        indexDevices();
                    });
                    $rootScope.model_iot_device.loadData(false);
                }

                /*
                if ($rootScope.model_iot_calendarday.loaded) {
                    $rootScope.log(myscope, 'loadData', "model_iot_calendarday.has already been loaded", null, null, "info");
                    indexCalendardays();
                }
                else{
                    $rootScope.$on('model_iot_calendarday.loaded', function () {
                        $rootScope.log(myscope, 'loadData', "model_iot_calendarday.loaded", null, null, "success");
                        indexCalendardays();
                    });
                    $rootScope.model_iot_calendarday.loadData(false);
                }
                */

                $rootScope.model_iot_sample.loaded = true;
                $rootScope.model_iot_sample.loading = false;
                $rootScope.$broadcast('model_iot_sample.loaded');
                $rootScope.log(myscope, 'loadData', "samples loaded and indexed", null, null, "success");

            }, function error(error) {
                $rootScope.showerror(myscope, 'loadData', error);
                $rootScope.model_iot_sample.loading = false;
            });
    };

    $rootScope.model_iot_sample.loadRecord = function (pIndex) {
        var lItem = $rootScope.iot_samples[pIndex];
        var lId = lItem.id;
        if (lItem.xdevice)
            // remove the record from list of samples
            angular.forEach(lItem.xdevice.xsamples, function (sample, sampleindex) {
                if (sample.id == lId) {
                    lItem.xdevice.xsamples.splice(sampleindex, 1); // remove sample from array
                }
            });

        if (lItem.xcalnedarday)
            // remove the record from list of samples
            angular.forEach(lItem.xcalendarday.xsamples, function (sample, sampleindex) {
                if (sample.id == lId) {
                    lItem.xcalendarday.xsamples.splice(sampleindex, 1); // remove sample from array
                }
            });

        // save subitems
        //var lxsubdevices = $rootScope.iot_devices[pIndex].xsubdevices;
        //var lxtasks = $rootScope.iot_devices[pIndex].xtasks;
        //var lxsamples = $rootScope.iot_devices[pIndex].xsamples;

        //$rootScope.iot_samples[pIndex] = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_sample/" + lId,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_samples[pIndex] = response.data;
                // restore subitems
                //$rootScope.iot_devices[pIndex].xsubdevices = lxsubdevices;
                //$rootScope.iot_devices[pIndex].xtasks = lxtasks;
                //$rootScope.iot_devices[pIndex].xsamples = lxsamples;

                $rootScope.model_iot_sample.postImport(pIndex);
                indexDevice($rootScope.iot_samples[pIndex]);
//                indexCalendarday($rootScope.iot_samples[pIndex]);
            }, function error(error) {
                $rootScope.showerror(myscope, 'loadRecord', error);
            });
    };

    $rootScope.model_iot_sample.delete = function (pItems) {

        angular.forEach(pItems, function (item, index) {
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/iot_sample/" + item.id,
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


app.controller('iot_samplecontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert, ker_reference, model_iot_sample, $route) {
    $scope.entity = 'iot_sample';
    $scope.controllerName = $scope.entity +'controller';
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
            if (!pLink.$parent.id || pLink.$parent.id!=pLink.$parent.$id) {  // if controllerName is derived 
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
        $rootScope.model_iot_sample.loadData(pForce); 
    };


    $rootScope.$watchCollection($scope.entity+"s", function () {
        $rootScope.log(myscope, "$watchCollection", "*** data changed ***", null, null, "info");           
        $rootScope.checkSelectedRows($scope.listid, $rootScope.iot_samples);
    }, true);

    $scope.filterDevices= function (item) {
        var dispfield = document.getElementById('displaydevices.' + $scope.parentControllerName);
        if (!dispfield)
            return true;

        $scope.displaydevices = dispfield.value;
//        console.log("displaydevices", $scope.displaymasterdevices);

        if ($scope.displaydevices == 'ALL') {
            return true;
        }
        if (!item.xdevice) {
            //console.log("order not found", item.id);

            if ($scope.displaydevices == 'SELECTED+' || $scope.displaydevices == 'NULL')
                return true;
            else
                return false;
        }

        if ($scope.displaydevices == 'NULL')
            return false;

        if ($scope.parentControllerName == 'iot_devicecontroller') {
            l_devices = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.iot_devices);
//            console.log("displaymasterdevices.0", $scope.parent.listid)
//            console.log("displaymasterdevices.1", l_masters);
        }
        else
            if ($scope.parentControllerName == 'iot_deviceeditcontroller') {
                l_devices = {
                    order: {
                        id: $scope.parent.dataCopy.id
                    }
                };

            } else {
                l_devices = null;
            }


        l_result = false;
        angular.forEach(l_devices, function (device, index) {
            if (device.id == item.deviceid) {
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

    function i_connecttodevice(pDevices) {
        l_samples = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_samples);

        if (!confirm("Connect " + l_samples.length + " samples to device " + pDevices[0].code + "?"))
            return;

        angular.forEach(l_samples, function (item, index) {
            if (item.deviceid) {
                if (item.deviceid == pDevices[0].id)
                    return;
                if (!confirm("Sample " + item.id + " is already connected to device " + sample.xdevice.code + ". Reconnect to " + pDevices[0].code + "?"))
                    return;
            }

            item.deviceid = pDevices[0].id;
/*
            invoice.order = {
                id: pOrders[0].id, customerid: pOrders[0].customer.id , customer: { id: pOrders[0].customer.id , name: pOrders[0].customer.name }};
                */
            $rootScope.model_iot_sample.save(item);
        });

    }

    $scope.connecttodevice = function () {
        var l_devices; 

        if ($scope.parentControllerName == 'iot_devicecontroller') {
            l_devices = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.iot_devices);
            if (l_devices.length != 1) {
                alert('Select exactly one Device');
                $rootScope.showerror($scope, 'connecttodevice.1', 'invalid number of records');
                return;
            }
            i_connecttodevice(l_devices);
        }
        else
            if ($scope.parentControllerName == 'iot_deviceeditcontroller') {
                l_devices = [{
                    id: $scope.parent.dataCopy.id,
                    code: $scope.parent.dataCopy.code
                }];
                i_connecttodevice(l_devices);

            } else { /* call customer lookup */
                $rootScope.entitySelect('iot_device', false).then(function (l_devices) {
                    i_connecttodevice(l_devices);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "Connect Invoices to Order", "No order selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'connecttodevice', error);
                });
            }
    }


    $scope.i_new = function (pDevice){
        // set id to null and other items to defaults
        var lData = {
            id: null, type: null, xdevice: pDevice
        };

        $scope.detail(lData);
    }

    $scope.new = function (pDevice) {
        var l_devices; 
        
        // get device id and code to l_devices[0]
        if (pDevice) {
            l_devices = [{
                id: pDevice.id,
                code: pDevice.code
            }];
            $scope.i_new(l_devices[0]);
        }
        else if ($scope.parentControllerName == 'iot_devicecontroller') {
            l_devices = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.iot_devices);
            if (l_devices.length != 1) {
                alert('Select exactly one Device');
                $rootScope.showerror($scope, 'new.1', 'invalid number of records');
                return;
            }
            $scope.i_new(l_devices[0]);
        }
        else
            if ($scope.parentControllerName == 'iot_deviceeditcontroller') {
                l_devices = [{
                    id: $scope.parent.dataCopy.id,
                    code: $scope.parent.dataCopy.code
                }];
                $scope.i_new(l_devices[0]);

            } else { /* call customer lookup */
                // use only if the deviceid is mandatory
                $rootScope.entitySelect('iot_device', false).then(function (l_devices) {
                    $scope.i_new(l_devices[0]);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "New sample", "No device selected", "OK");
                    }
                    else 
                        $rootScope.showerror($scope, 'new', error);
                        
                });
                /*
                // use only if the deviceid is NOT mandatory
                $scope.i_new(null);
                */
            }
    }

    $scope.edit = function () {
        lData = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_samples);
        if (lData.length != 1) {
            $rootScope.showalert("error", "Edit", "Select exactly one record!", "OK")
            return;
        }

        $scope.detail(lData[0]);
    };

    $scope.detail = function (pData) {

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/' + $scope.entity +'edit.html',
            controller: $scope.entity+'editcontroller',
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
            $rootScope.model_iot_sample.save(container)
        }, function () { /* cancel */ });
    };

    $scope.delete = function () {
        lItems = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_samples);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Sample(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Delete Sample(s)", "Delete " + lItems.length + " records?"))
            return;

//        $rootScope.resetSelection($scope.listid);

        $rootScope.model_iot_sample.delete(lItems);
    };

    $scope.refreshdetail = function () {
        $scope.selectediot_sample = null;

        l_selecteddata = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_samples);
        if (l_selecteddata.length != 1) {
            return;
        }

        $scope.selectediot_sample = l_selecteddata[0];      

        /*

        // test of toasts
        $rootScope.log(myscope, 'refreshdetail', "detail displayed (0)", null, null, null);
        $rootScope.log(myscope, 'refreshdetail', "detail displayed (1)", null, null, "info");
        $rootScope.log(myscope, 'refreshdetail', "detail displayed (2)", null, null, "success");
        $rootScope.log(myscope, 'refreshdetail', "detail displayed (3)", null, null, "warning");
        $rootScope.log(myscope, 'refreshdetail', "detail displayed (4)", null, null, "error");
         
        // test of SignalR messaging
        $rootScope.serverUpdateHub.connection.invoke("Send", "test user", "test message").catch(function (err) {    // call method "Send" of "ServerUpdateHub" with parameters "test user" and "test message"
            return console.error(err.toString());
        });
        */
    };

    $scope.ok = function () {
        var lContainer = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_samples);
        $rootScope.modalInstance[$scope.instance].close(lContainer);
    };

    $scope.cancel = function () {
        $rootScope.modalInstance[$scope.instance].dismiss('cancel');
    };

    if ($scope.parentControllerName == "iot_deviceeditcontroller")
        $scope.displaydevices = "SELECTED";
    else if ($scope.parentControllerName == "iot_devicecontroller")
        $scope.displaydevices = "SELECTED+";
    else
        $scope.displaydevices = "ALL";
    $scope.displaydevicesoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to selected devices" },
        { Value: "SELECTED", Text: "Connected to selected devices" },
        { Value: "NULL", Text: "Not connected to devices" }
    ];

    $scope.selectediot_sample = null;
    $scope.loadData(false);
    $rootScope.kerReftabInit();
});

app.controller('iot_sampleeditcontroller', function ($scope, $uibModalInstance, container, $uibModal, $rootScope, ker_reference) {
    $scope.entity = 'iot_sample';
    $scope.controllerName = $scope.entity+'editcontroller';
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
        //$rootScope.model_iot_sample.save(container)
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
