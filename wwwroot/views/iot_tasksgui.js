/**
 * iot_task list
 */

app.service('model_iot_task', function ($rootScope, $http, serverUpdateHub) {
    $rootScope.model_iot_task = { packageName: 'model_iot_task' };
    var myscope = $rootScope.model_iot_task;

    $rootScope.model_iot_task.loaded = false;
    $rootScope.model_iot_task.loading = false;

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

        if (!pItem.xdevice.xtasks)
            pItem.xdevice.xtasks = [];
        pItem.xdevice.xtasks.push(pItem);
        if ((!pItem.xdevice.xlasttask) ||
            pItem.xdevice.xlasttask.scheduled < pItem.scheduled)
            pItem.xdevice.xlasttask = pItem;
    };

    function indexDevices() {
        angular.forEach($rootScope.iot_tasks, function (lItem, lIndex) {
            indexDevice(lItem);
        });
    };

    $rootScope.model_iot_task.serverUpdateHubMsgResolve = function (pMessage) {
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

            lItem = $rootScope.iot_tasks.find(i => i.id == lMsg.id);
            if (lItem === undefined) {
                if (lMsg.operationtxt == "update") {
                    $rootScope.showerror(myscope, 'loadData', {
                        status: 500, statusText: 'UpdatedRecordNotFound: ' + lMsg.id
                    });
                }
                lIndex = $rootScope.iot_tasks.push({ id: lMsg.id }) - 1;
                $rootScope.iot_tasks[lIndex].index = lIndex;
            }
            else
                lIndex = lItem.index;
            $rootScope.model_iot_task.loadRecord(lIndex);
        };

        if (lMsg.operationtxt == "delete") {
            $rootScope.log(myscope, 'SignalR', "An item deleted", null, pMessage, "info");
            lItem = $rootScope.iot_tasks.find(i => i.id == lMsg.id);
            if (lItem === undefined) {
                $rootScope.showerror(myscope, 'loadData', {
                    status: 500, statusText: 'DeletedRecordNotFound: ' + lMsg.id
                });
                return;
            }

            /*
            if (
                (lItem.xsubdevices && lItem.xsubdevices.length > 0) ||
                (lItem.xtasks && lItem.xtasks.length > 0) ||
                (lItem.xtasks && lItem.xtasks.length > 0)
            ) {
                $rootScope.showerror(myscope, 'loadData', {
                    status: 500, statusText: "DeletedRecordContainsSubrecords: " + lItem.id
                });
                return;
            }
            */

            $rootScope.iot_tasks.splice(lItem.index, 1);
            for (lIndex = lItem.index; lIndex < $rootScope.iot_tasks.length; lIndex++)
                $rootScope.iot_tasks[lIndex].index = lIndex;
            if ($rootScope.iot_tasks.length > 0)
                $rootScope.model_iot_task.loadRecord(0);   // reload any record to refresh the view
            else
                $rootScope.iot_tasks = null;
        };
    }

    $rootScope.model_iot_task.postImport = function (pIndex) {
        var lItem = $rootScope.iot_tasks[pIndex];
        lItem.index = pIndex;
        // add another calculations
        lItem.scheduled = lItem.scheduled + "Z";
        lItem.scheduledtime = new Date(lItem.scheduled);  

        lItem.accepted = lItem.accepted + "Z";
        lItem.acceptedtime = new Date(lItem.accepted);  

        lItem.completed = lItem.completed + "Z";
        lItem.completedtime = new Date(lItem.completed);  
    };

    $rootScope.model_iot_task.loadData = function (pForce) {
        if ($rootScope.model_iot_task.loaded) {
            if (!pForce)  // avoid double-loading
                return;
            else {
                // delete all relations to the entity from the model - data are fe-fetched from the database;             
                angular.forEach($rootScope.iot_devices, function (lItem, lIndex) {
                    lItem.xtasks = [];
                });
            }
        };
        if ($rootScope.model_iot_task.loading) {
            return;
        };

        $rootScope.model_iot_task.loading = true;

        $rootScope.iot_tasks = null;

        // initialize SignalR incremental updates
        $rootScope.serverUpdateHub.init();
        $rootScope.serverUpdateHub.connection.on("iot_task", function (pMessage) { $rootScope.model_iot_task.serverUpdateHubMsgResolve(pMessage) });


        $rootScope.log(myscope, 'loadData', "start loading tasks", null, null, "info");
        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_task",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_tasks = response.data;
                $rootScope.log(myscope, 'loadData', "start indexing tasks", null, null, "info");
                angular.forEach($rootScope.iot_tasks, function (item, lIndex) {
                    $rootScope.model_iot_task.postImport(lIndex);
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

                $rootScope.model_iot_task.loaded = true;
                $rootScope.model_iot_task.loading = false;
                $rootScope.$broadcast('model_iot_task.loaded');
                $rootScope.log(myscope, 'loadData', "tasks loaded and indexed", null, null, "success");

            }, function error(error) {
                $rootScope.showerror(myscope, 'loadData', error);
                $rootScope.model_iot_task.loading = false;
            });
    };

    $rootScope.model_iot_task.loadRecord = function (pIndex) {
        var lItem = $rootScope.iot_tasks[pIndex];
        var lId = lItem.id;
        if (lItem.xdevice)
            // remove the record from list of tasks
            angular.forEach(lItem.xdevice.xtasks, function (task, taskindex) {
                if (task.id == lId) {
                    lItem.xdevice.xtasks.splice(taskindex, 1); // remove task from array
                }
            });


        // save subitems
        //var lxsubdevices = $rootScope.iot_devices[pIndex].xsubdevices;
        //var lxtasks = $rootScope.iot_devices[pIndex].xtasks;
        //var lxtasks = $rootScope.iot_devices[pIndex].xtasks;

        //$rootScope.iot_tasks[pIndex] = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_task/" + lId,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_tasks[pIndex] = response.data;
                // restore subitems
                //$rootScope.iot_devices[pIndex].xsubdevices = lxsubdevices;
                //$rootScope.iot_devices[pIndex].xtasks = lxtasks;
                //$rootScope.iot_devices[pIndex].xtasks = lxtasks;

                $rootScope.model_iot_task.postImport(pIndex);
                indexDevice($rootScope.iot_tasks[pIndex]);
//                indexCalendarday($rootScope.iot_tasks[pIndex]);
            }, function error(error) {
                $rootScope.showerror(myscope, 'loadRecord', error);
            });
    };


    $rootScope.model_iot_task.save = function (container) {

        var l_container = angular.copy(container);

        l_container.type = parseInt(l_container.type);

        if (!l_container.deviceid)
            if (l_container.xdevice)
                l_container.deviceid = l_container.device.id;

        // delete fields not fitting to main object entity
        if (l_container.xdevice)
            delete l_container['xdevice'];

        if (l_container.acceptedtime)
            l_container.accepted = l_container.acceptedtime.toJSON();
        else
            l_container.accepted = null;

        if (l_container.completedtime)
            l_container.completed = l_container.completedtime.toJSON();
        else
            l_container.completed = null;
        if (l_container.scheduledtime)
            l_container.scheduled = l_container.scheduledtime.toJSON();
        else
            l_container.scheduled = null;


        if (l_container.id) {
            //UPDATE

            // update main entity
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/iot_task/" + l_container.id,
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
                url: $rootScope.ApiAddress + "api/iot_task",
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


    $rootScope.model_iot_task.delete = function (pItems) {

        angular.forEach(pItems, function (item, index) {
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/iot_task/" + item.id,
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


app.controller('iot_taskcontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert, ker_reference, model_iot_task, $route) {
    $scope.entity = 'iot_task';
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
        $rootScope.model_iot_task.loadData(pForce); 
    };


    $rootScope.$watchCollection($scope.entity+"s", function () {
//        $rootScope.log(myscope, "$watchCollection", "*** data changed ***", null, null, "info");           
        $rootScope.log(myscope, "$watchCollection", "*** data changed ***", null, null, null);           
        $rootScope.checkSelectedRows($scope.listid, $rootScope.iot_tasks);
    }, true);

    $scope.filterDevices= function (item) {
        var dispfield = document.getElementById('displaydevices.' + $scope.listid);
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
        l_tasks = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_tasks);

        if (!confirm("Connect " + l_tasks.length + " tasks to device " + pDevices[0].code + "?"))
            return;

        angular.forEach(l_tasks, function (item, index) {
            if (item.deviceid) {
                if (item.deviceid == pDevices[0].id)
                    return;
                if (!confirm("Task " + item.id + " is already connected to device " + task.xdevice.code + ". Reconnect to " + pDevices[0].code + "?"))
                    return;
            }

            item.deviceid = pDevices[0].id;
/*
            invoice.order = {
                id: pOrders[0].id, customerid: pOrders[0].customer.id , customer: { id: pOrders[0].customer.id , name: pOrders[0].customer.name }};
                */
            $rootScope.model_iot_task.save(item);
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
                        //   $rootScope.showalert("error", "New task", "No device selected", "OK");
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
        lData = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_tasks);
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
            $rootScope.model_iot_task.save(container)
        }, function () { /* cancel */ });
    };

    $scope.delete = function () {
        lItems = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_tasks);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Task(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Delete Task(s)", "Delete " + lItems.length + " records?"))
            return;

//        $rootScope.resetSelection($scope.listid);

        $rootScope.model_iot_task.delete(lItems);
    };

    $scope.refreshdetail = function () {
        $scope.selectediot_task = null;

        l_selecteddata = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_tasks);
        if (l_selecteddata.length != 1) {
            return;
        }

        $scope.selectediot_task = l_selecteddata[0];      

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
        var lContainer = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_tasks);
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

    $scope.selectediot_task = null;
    $scope.loadData(false);
    $rootScope.kerReftabInit();
});

app.controller('iot_taskeditcontroller', function ($scope, $uibModalInstance, container, $uibModal, $rootScope, ker_reference) {
    $scope.entity = 'iot_task';
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

    $scope.taskstatuslist = $rootScope.kerReftabGetList('TASKSTATUS');
    /*

    $scope.devicetypelist = $rootScope.kerReftabGetList('DEVICETYPE');

    $scope.unitlist = $rootScope.kerReftabGetList('UNIT');
*/

    $scope.objectData = container;
    $scope.dataCopy = angular.copy($scope.objectData);

     // initialize datapickers for dates
    $scope.popupaccepted = { opened: false }; // initialize datapicker for fromdate
    $scope.popupcompleted = { opened: false }; // initialize datapicker for fromdate
    $scope.popupscheduled = { opened: false }; // initialize datapicker for fromdate

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
        //$rootScope.model_iot_task.save(container)
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

    // open datapickers for dates
    $scope.openaccepted = function () { // open datapicker for fromdate
        $scope.popupaccepted.opened = true;
    };
    $scope.openscheduled = function () { // open datapicker for fromdate
        $scope.popupscheduled.opened = true;
    };
    $scope.opencompleted = function () { // open datapicker for fromdate
        $scope.popupcompleted.opened = true;
    };

});
