/**
 * iot_device list
 */

app.service('model_iot_device', function ($rootScope, $http, model_iot_sample, model_iot_task, serverUpdateHub) {
    $rootScope.model_iot_device = { packageName: 'model_iot_device' };
    var myscope = $rootScope.model_iot_device;

    $rootScope.model_iot_device.loaded = false;
    $rootScope.model_iot_device.loading = false;

    function indexMasterdevice(pItem) {
        if (!pItem.masterdeviceid) {
            pItem.xmasterdevice = null;
            return; 
        }

        if (pItem.xmasterdevice && (pItem.xmasterdevice.id==pItem.masterdeviceid))
            return; 

        pItem.xmasterdevice = $rootScope.iot_devices.find(dev => dev.id == pItem.masterdeviceid);
        if (!pItem.xmasterdevice) {
            // item not found in the collection
            // call add_new_item and connect it to the new one
            // or raise an error
            $rootScope.showerror(myscope, 'indexMasterdevice', null);
        }

        if (!pItem.xmasterdevice.xsubdevices)
            pItem.xmasterdevice.xsubdevices = [];
        pItem.xmasterdevice.xsubdevices.push(pItem);
    }


    $rootScope.model_iot_device.serverUpdateHubMsgResolve = function(pMessage) {
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

            lItem = $rootScope.iot_devices.find(i => i.id == lMsg.id);
            if (lItem === undefined) {
                if (lMsg.operationtxt == "update") {
                    $rootScope.showerror(myscope, 'loadData', {
                        status: 500, statusText: 'UpdatedRecordNotFound: ' + lMsg.id
                    });
                }
                lIndex = $rootScope.iot_devices.push({ id: lMsg.id }) - 1;
                $rootScope.iot_devices[lIndex].index = lIndex;
            }
            else
                lIndex = lItem.index;
            $rootScope.model_iot_device.loadRecord(lIndex);
        };

        if (lMsg.operationtxt == "delete") {
            $rootScope.log(myscope, 'SignalR', "An item deleted", null, pMessage, "info");
            lItem = $rootScope.iot_devices.find(i => i.id == lMsg.id);
            if (lItem === undefined) {
                $rootScope.showerror(myscope, 'loadData', {
                    status: 500, statusText: 'DeletedRecordNotFound: ' + lMsg.id
                });
                return;
            }

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

            $rootScope.iot_devices.splice(lItem.index, 1);
            for (lIndex = lItem.index; lIndex < $rootScope.iot_devices.length; lIndex++)
                $rootScope.iot_devices[lIndex].index = lIndex;
            if ($rootScope.iot_devices.length > 0)
                $rootScope.model_iot_device.loadRecord(0); // reload any record to refresh the view
            else
                $rootScope.iot_devices = null;
        };
    }

    $rootScope.model_iot_device.postImport = function (pIndex) {
        var lItem = $rootScope.iot_devices[pIndex];
        lItem.index = pIndex;        
        indexMasterdevice(lItem);
    };

    $rootScope.model_iot_device.loadData = function (pForce) {

        if ($rootScope.model_iot_device.loaded) {
            if (!pForce)  // avoid double-loading
                return;
            else {
                // delete all relations to the entity from the model - data are fe-fetched from the database;  
            }
        };
        if ($rootScope.model_iot_device.loading) {
            return;
        };

        $rootScope.model_iot_device.loading = true;

        $rootScope.iot_devices = null;

        // initialize SignalR incremental updates
        $rootScope.serverUpdateHub.init();
        $rootScope.serverUpdateHub.connection.on("iot_device", function (pMessage) { $rootScope.model_iot_device.serverUpdateHubMsgResolve(pMessage) });

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_device",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_devices = response.data;

                // calculate computed data
                angular.forEach($rootScope.iot_devices, function (item, lIndex) {
                    $rootScope.model_iot_device.postImport(lIndex);
                });

                $rootScope.model_iot_device.loaded = true;
                $rootScope.model_iot_device.loading = false;
                $rootScope.$broadcast('model_iot_device.loaded');

                // load sub-entities
                $rootScope.model_iot_sample.loadData();
                $rootScope.model_iot_task.loadData();

            }, function error(error) {
                    $rootScope.showerror(myscope, 'loadData', error);
            });
    };

    $rootScope.model_iot_device.loadRecord = function (pIndex) {
        var lItem = $rootScope.iot_devices[pIndex];
        var lId = lItem.id;

        if (lItem.xmasterdevice)    
            // remove the record from list of subdevices
            angular.forEach(lItem.xmasterdevice.xsubdevices, function (subdevice, subdeviceindex) {   
                if (subdevice.id == lId) {
                    lItem.xmasterdevice.xsubdevices.splice(subdeviceindex, 1); // remove subdevice from array
                }
            });

        // save sub-items
        var lxsubdevices = $rootScope.iot_devices[pIndex].xsubdevices;
        var lxtasks = $rootScope.iot_devices[pIndex].xtasks;
        var lxsamples = $rootScope.iot_devices[pIndex].xsamples;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_device/" + lId,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_devices[pIndex] = response.data;
                //restore subitems
                $rootScope.iot_devices[pIndex].xsubdevices = lxsubdevices;
                $rootScope.iot_devices[pIndex].xtasks = lxtasks;
                $rootScope.iot_devices[pIndex].xsamples = lxsamples;

                $rootScope.model_iot_device.postImport(pIndex);

            }, function error(error) {
                    $rootScope.showerror(myscope, 'loadRecord', error);
            });
    };


    $rootScope.model_iot_device.save = function (container) {

        var l_container = angular.copy(container);

        l_container.type = parseInt(l_container.type);

        if (!l_container.masterdeviceid)
            if (l_container.xmasterdevice)
                l_container.masterdeviceid = l_container.xmasterdevice.id;

        // delete fields not fitting to main object entity
        if (l_container.xmasterdevice)
            delete l_container['xmasterdevice'];
        if (l_container.xsubdevices)
            delete l_container['xsubdevices'];
        if (l_container.xtasks)
            delete l_container['xtasks'];
        if (l_container.xsamples)
            delete l_container['xsamples'];

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
                url: $rootScope.ApiAddress + "api/iot_device/" + l_container.id,
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
                url: $rootScope.ApiAddress + "api/iot_device",
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


    $rootScope.model_iot_device.delete = function (pItems) {

        angular.forEach(pItems, function (item, index) {
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/iot_device/" + item.id,
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


app.controller('iot_devicecontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert, ker_reference, model_iot_device, /*$uibModalInstance, */$route, $filter) {
    $scope.controllerName = 'iot_devicecontroller';
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

    $rootScope.log(myscope, 'init', "New controller", $scope.controllerName + ": " + $scope.id, null, null);                    
    $rootScope.log(myscope, 'init', "mode", $scope.mode, null, null);                    
    $rootScope.log(myscope, 'init', "multilineallowed", $scope.multilineallowed, null, null);                    
    $rootScope.log(myscope, 'init', "instance", $scope.instance, null, null);                    

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
        $rootScope.model_iot_device.loadData(pForce); 
    };


    $rootScope.$watchCollection("iot_devices", function () {
//        $rootScope.log(myscope, "$watchCollection", "*** data changed ***", null, null, "info");           
        $rootScope.log(myscope, "$watchCollection", "*** data changed ***", null, null, null);           
        $rootScope.checkSelectedRows($scope.listid, $rootScope.iot_devices);
        $scope.pageChanged($scope.currentPage);
    }, true);

    $scope.filterMasterdevices= function (item) {
        var dispfield = document.getElementById('displaymasterdevices.' + $scope.listid);
        if (!dispfield)
            return true;

        $scope.displaymasterdevices = dispfield.value;
//        console.log("displaymasterdevices", $scope.displaymasterdevices);

        if ($scope.displaymasterdevices == 'ALL') {
            return true;
        }
        if (!item.xmasterdevice) {
            //console.log("order not found", item.id);

            if ($scope.displaymasterdevices == 'SELECTED+' || $scope.displaymasterdevices == 'NULL')
                return true;
            else
                return false;
        }

        if ($scope.displaymasterdevices == 'NULL')
            return false;

        if ($scope.parentControllerName == 'iot_devicecontroller') {
            l_masters = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.iot_devices);
//            console.log("displaymasterdevices.0", $scope.parent.listid)
//            console.log("displaymasterdevices.1", l_masters);
        }
        else
            if ($scope.parentControllerName == 'iot_deviceeditcontroller') {
                l_masters = {
                    order: {
                        id: $scope.parent.dataCopy.id
                    }
                };

            } else {
                l_masters = null;
            }


        l_result = false;
        angular.forEach(l_masters, function (master, index) {
            if (master.id == item.masterdeviceid) {
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



    function i_connecttomasterdevice(pMasterdevices) {
        l_devices = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);

        if (!confirm("Connect " + l_devices.length + " devices to masterdevice " + pMasterdevices[0].code + "?"))
            return;

        angular.forEach(l_devices, function (device, index) {
            if (device.masterdeviceid) {
                if (device.masterdeviceid == pMasterdevices[0].id)
                    return;
                if (!confirm("Device " + device.code + " is already connected to masterdevice " + device.xmasterdevice.code + ". Reconnect to " + pMasterdevices[0].code + "?"))
                    return;
            }

            device.masterdeviceid = pMasterdevices[0].id;
/*
            invoice.order = {
                id: pOrders[0].id, customerid: pOrders[0].customer.id , customer: { id: pOrders[0].customer.id , name: pOrders[0].customer.name }};
                */
            $rootScope.model_iot_device.save(device);
        });

    }

    $scope.connecttomasterdevice = function () {
        var l_masterdevices; 

        if ($scope.parentControllerName == 'iot_devicecontroller') {
            l_masterdevices = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.iot_devices);
            if (l_masterdevices.length != 1) {
                alert('Select exactly one Master device');
                $rootScope.showerror($scope, 'connecttomasterdevice.1', 'invalid number of records');
                return;
            }
            i_connecttomasterdevice(l_masterdevices);
        }
        else
            if ($scope.parentControllerName == 'iot_deviceeditcontroller') {
                l_masterdevices = [{
                    id: $scope.parent.dataCopy.id,
                    code: $scope.parent.dataCopy.code
                }];
                i_connecttomasterdevice(l_masterdevices);

            } else { /* call customer lookup */
                $rootScope.entitySelect('iot_device', false).then(function (l_masterdevices) {
                    i_connecttomasterdevice(l_masterdevices);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "Connect Invoices to Order", "No order selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'connecttomasterdevice', error);
                });
            }
    }


    $scope.i_new = function (pMasterdevice){
        // set id to null and other items to defaults
        var lData = {
            id: null, type: null, xmasterdevice: pMasterdevice
        };

        $scope.detail(lData);
    }

    $scope.new = function (pMasterdevice) {
        var l_masterdevices; 
        
        // get masterdevice id and code to l_masterdevices[0]
        if (pMasterdevice) {
            l_masterdevices = [{
                id: pMasterdevice.id,
                code: pMasterdevice.code
            }];
            $scope.i_new(l_masterdevices[0]);
        }
        else if ($scope.parentControllerName == 'iot_devicecontroller') {
            l_masterdevices = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.iot_devices);
            if (l_masterdevices.length != 1) {
                alert('Select exactly one Master device');
                $rootScope.showerror($scope, 'new.1', 'invalid number of records');
                return;
            }
            $scope.i_new(l_masterdevices[0]);
        }
        else
            if ($scope.parentControllerName == 'iot_deviceeditcontroller') {
                l_masterdevices = [{
                    id: $scope.parent.dataCopy.id,
                    code: $scope.parent.dataCopy.code
                }];
                $scope.i_new(l_masterdevices[0]);

            } else { /* call customer lookup */
                /*
                // use only if the masterdeviceid is mandatory
                $rootScope.entitySelect('iot_device', false).then(function (l_masterdevices) {
                    $scope.i_new(l_masterdevices[0]);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "New sub-device", "No master device selected", "OK");
                    }
                    else 
                        $rootScope.showerror($scope, 'new', error);
                        
                    });*/
                $scope.i_new(null);
            }
    }

    $scope.edit = function () {
        lData = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);
        if (lData.length != 1) {
            $rootScope.showalert("error", "Edit", "Select exactly one record!", "OK")
            return;
        }

        $scope.detail(lData[0]);
    };

    $scope.detail = function (pData) {

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/iot_deviceedit.html',
            controller: 'iot_deviceeditcontroller',
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
            $rootScope.model_iot_device.save(container)
        }, function () { /* cancel */ });
    };

    $scope.delete = function () {
        lItems = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Device(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Delete Device(s)", "Delete " + lItems.length + " records?"))
            return;

//        $rootScope.resetSelection($scope.listid);

        $rootScope.model_iot_device.delete(lItems);
    };
   
    $scope.refreshdetail = function () {

/*
        $scope.selectediot_device = null;

        l_selecteddata = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);
        if (l_selecteddata.length != 1) {
            return;
        }

        $scope.selectediot_device = l_selecteddata[0];      
*/

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

        // draw graph


        lGraph = document.getElementById('iot_devices_graph.' + $scope.listid);
        if (lGraph) {

            var lLayout = {
                title: 'Samples',
                xaxis: {
                    //                        title: 'Date',
                    //                        showgrid: false,
                    //                        zeroline: false
                },
                yaxis: {
                    title: "value",
                    showticksuffix: "last"
                    //                        showline: false
                }
            };

            var lItems = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);

            var lTraces = [];
            var lAxeX = [];
            var lAxeY = [];
            var lTrace = {};

            angular.forEach(lItems, function (item, index) {

                if (item.xsamples) {
                    lAxeX = item.xsamples.sort(function compare(a, b) { return a.timestamptime - b.timestamptime}).map(a => a.timestamptime);
                    lAxeY = item.xsamples.sort(function compare(a, b) { return a.timestamptime - b.timestamptime }).map(a => a.value);
                } else {
                    lAxeX = [];
                    lAxeY = [];
                }
                lTrace = {
                    type: "scatter",
                    mode: "lines",
                    x: lAxeX,
                    y: lAxeY,
//                    line: { color: '#17BECF' },
                    name: item.code
                };

                lTraces.push(lTrace);

            });

            Plotly.newPlot(lGraph, lTraces, lLayout);
        }





    };

    $scope.ok = function () {
        var lContainer = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);
        $rootScope.modalInstance[$scope.instance].close(lContainer);
    };

    $scope.cancel = function () {
        $rootScope.modalInstance[$scope.instance].dismiss('cancel');
    };

    if ($scope.parentControllerName == "iot_deviceeditcontroller")
        $scope.displaymasterdevices = "SELECTED";
    else if ($scope.parentControllerName == "iot_devicecontroller")
        $scope.displaymasterdevices = "SELECTED+";
    else
        $scope.displaymasterdevices = "ALL";
    $scope.displaymasterdevicesoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to selected devices" },
        { Value: "SELECTED", Text: "Connected to selected devices" },
        { Value: "NULL", Text: "Not connected to devices" }
    ];

    $scope.selectediot_device = null;
    $scope.loadData(false);
    $rootScope.kerReftabInit();
});

app.controller('iot_deviceeditcontroller', function ($scope, $uibModalInstance, container, $uibModal, $rootScope, ker_reference) {
    $scope.controllerName = 'iot_deviceeditcontroller';
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

    $scope.devicecategorylist = $rootScope.kerReftabGetList('DEVICECATEGORY');

    $scope.devicetypelist = $rootScope.kerReftabGetList('DEVICETYPE');

    $scope.unitlist = $rootScope.kerReftabGetList('UNIT');

    $scope.locationlist = $rootScope.kerReftabGetList('LOCATION');

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
        //$rootScope.model_iot_device.save(container)
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

app.controller('iot_deviceparkingspotcontroller', function ($scope, $uibModal, $rootScope, guialert, ker_reference, model_iot_device, model_iot_task, $route, $filter, $cookies, $window) {
    $scope.controllerName = 'iot_deviceparkingspotcontroller';
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


    $scope.loadData = function (pForce) {
        $rootScope.model_iot_device.loadData(pForce);
        findDevice();
    };

    function findDevice() {
        if (!$rootScope.iot_devices) {
            $scope.LIGHTSPARKINGVOLTAGEindex = null;
            return;
        }
            
        var lDevice = $rootScope.iot_devices.find(dev => dev.code == "LIGHTSPARKINGVOLTAGE");
        if (!lDevice)
            $scope.LIGHTSPARKINGVOLTAGEindex = null;
        else
            $scope.LIGHTSPARKINGVOLTAGEindex = lDevice.index;

        var lRelayDevice = $rootScope.iot_devices.find(dev => dev.code == "LIGHTSPARKING");
        if (!lRelayDevice)
            $scope.LIGHTSPARKINGindex = null;
        else
            $scope.LIGHTSPARKINGindex = lRelayDevice.index;

    }

    $rootScope.$watchCollection("iot_devices", function () {
        $rootScope.log(myscope, "$watchCollection", "*** data changed ***", null, null, "info");
        findDevice();
    }, true);

    $scope.loadData(false);
    $rootScope.kerReftabInit();

    $scope.unitlist = $rootScope.kerReftabGetList('UNIT');

    $scope.locationlist = $rootScope.kerReftabGetList('LOCATION');


    $scope.on = function () {
        var lRelayDevice = $rootScope.iot_devices.find(dev => dev.code == "LIGHTSPARKING");

        lTask = {
            deviceid: lRelayDevice.id, 
            command: 'SWITCH ON'
        }
        lTask.taskstatusnm = 'SCHEDULED';
        lTask.scheduledtime = new Date();  
        $rootScope.model_iot_task.save(lTask);
    };

    $scope.off = function () {
        var lRelayDevice = $rootScope.iot_devices.find(dev => dev.code == "LIGHTSPARKING");

        lTask = {
            deviceid: lRelayDevice.id, 
            command: 'SWITCH OFF'
        }
        lTask.taskstatusnm = 'SCHEDULED';
        lTask.scheduledtime = new Date();  
        $rootScope.model_iot_task.save(lTask);
    };

    $scope.cancel = function () {
        angular.forEach($scope.objectData, function (value, key) {
            $scope.dataCopy[key] = value;
        });

        $uibModalInstance.dismiss('cancel');
    };

});

