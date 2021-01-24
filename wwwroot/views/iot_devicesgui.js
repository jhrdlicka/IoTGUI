/**
 * iot_device list
 */

app.service('model_iot_device', function ($rootScope, $http, model_iot_sample) {
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

            }, function error(error) {
                    $rootScope.showerror(myscope, 'model_iot_device.loadData', error);
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

        $rootScope.iot_devices[pIndex] = null;
        

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_device/" + lId,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_devices[pIndex] = response.data;
                $rootScope.model_iot_device.postImport(pIndex);
            }, function error(error) {
                    $rootScope.showerror(myscope, 'model_iot_device.loadRecord', error);
            });
    };

});

app.service('model_iot_sample', function ($rootScope, $http) {
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

    $rootScope.model_iot_sample.postImport = function (pIndex) {
        var lItem = $rootScope.iot_samples[pIndex];
        lItem.index = pIndex;
        // add another calculations
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
            }
        };
        if ($rootScope.model_iot_sample.loading) {
                return;
        };

        $rootScope.model_iot_sample.loading = true;

        $rootScope.iot_samples = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_sample",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_samples = response.data;
//                console.log("start indexing samples");
                angular.forEach($rootScope.iot_samples, function (item, lIndex) {
                    $rootScope.model_iot_sample.postImport(lIndex);
                });

                // load master table(s) and create relations
                if ($rootScope.model_iot_device.loaded) {
                    console.log('model_iot_device.has already been loaded');
                    indexDevices();
                }
                else
                    $rootScope.$on('model_iot_device.loaded', function () {
                        console.log('model_iot_device.loaded');
                        indexDevices();
                    });

                $rootScope.model_iot_sample.loaded = true;
                $rootScope.model_iot_sample.loading = false;
                $rootScope.$broadcast('model_iot_sample.loaded');

            }, function error(error) {
                $rootScope.showerror(myscope, 'model_iot_sample.loadData', error);
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

        $rootScope.iot_samples[pIndex] = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_sample/" + lId,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_samples[pIndex] = response.data;
                $rootScope.model_iot_sample.postImport(pIndex);
                indexDevice($rootScope.iot_samples[pIndex]);
            }, function error(error) {
                $rootScope.showerror(myscope, 'model_iot_sample.loadRecord', error);
            });
    };

});

app.controller('iot_devicecontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert, ker_reference, model_iot_device) {
    $scope.controllerName = 'iot_devicecontroller';
    $scope.packageName = $scope.controllerName;
    $scope.multilineallowed = true;
    $scope.id = $scope.$id; // to identify inherited values

    // register multiline lists and initiate multiline structures
    $scope.listid = $rootScope.lastlistid++;
    $rootScope.selectedRowsIndexes[$scope.listid] = [];

    console.log("controllerName", $scope.controllerName);

    $scope.setparent = function (pLink) {        
        if (!pLink.$parent)  // if there is no parent then set parent to null
            $scope.parent = null;
        else if (!pLink.$parent.controllerName) // if parent does not have a controllerName, then continue in the hierarchy
            $scope.setparent(pLink.$parent);
        else {
            $scope.parent = pLink.$parent;
            if (!pLink.$parent.id || pLink.$parent.id!=pLink.$parent.$id) {  // if controllerName is derived 
                console.log("!!!");
                $scope.setparent(pLink.$parent);
            }
            if ($scope.parent && ($scope.parent.$$watchers.length == 0)) {   // if controller is empty
                console.log("!!!2");
                $scope.setparent(pLink.$parent);
            }
        }
    }
    $scope.setparent($scope);
    if (!$scope.parent)
        $scope.parentControllerName = "";
    else
        $scope.parentControllerName = $scope.parent.controllerName;


    console.log("parent", $scope.parent);
    console.log("parentControllerName", $scope.parentControllerName);
    console.log("listid", $scope.listid);
    console.log("parent watchers", $scope.parent ? $scope.parent.$$watchers.length : 0)



    $scope.loadData = function (pForce) {
        $rootScope.resetSelection($scope.listid);
        $rootScope.model_iot_device.loadData(pForce); 
    };


    $scope.filterMasterdevices= function (item) {
        var dispfield = document.getElementById('displaymasterdevices.' + $scope.parentControllerName);
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



    function i_connecttomasterdevice(pOrders) {
        l_masterdevices = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);

        if (!confirm("Connect " + l_invoices.length + " invoices to order of " + pOrders[0].customer.name + "?"))
            return;

        angular.forEach(l_orders, function (order, index) {
            if (order.customerid) {
                if (order.customerid == pCustomers[0].id)
                    return;
                if (!confirm("Invoice nr. " + invoice.id + " is already connected to order of " + invoice.order.customer.name + ". Reconnect to " + pOrders[0].customer.name + "?"))
                    return;
            }

            invoice.orderid = pOrders[0].id;
            invoice.order = {
                id: pOrders[0].id, customerid: pOrders[0].customer.id , customer: { id: pOrders[0].customer.id , name: pOrders[0].customer.name }};
            $scope.save(invoice);
        });

    }

    $scope.connecttomasterdevice = function () {


        if ($scope.parentControllerName == 'iot_devicecontroller') {
            l_orders = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.iot_devices);
            if (l_orders.length != 1) {
                alert('Select exactly one Order');
                console.error('error', 'invalid number of records');
                return;
            }
            i_pcm_connecttoorder(l_orders);
        }
        else
            if ($scope.parentControllerName == 'pcm_ordereditcontroller') {
                l_orders = [{
                    id: $scope.parent.dataCopy.id,
                    customerid: $scope.parent.dataCopy.customerid,
                    customer: { id: $scope.parent.dataCopy.customer.id, name: $scope.parent.dataCopy.customer.name}
                }];
                i_pcm_connecttoorder(l_orders);

            } else { /* call customer lookup */
                $rootScope.entitySelect('pcm_order', false).then(function (l_orders) {
                    i_pcm_connecttoorder(l_orders);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "Connect Invoices to Order", "No order selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'pcm_connectstoorder', error);
                });
            }
    }


    $scope.i_new = function (pOrder){
        // set id to null and other items to defaults
        var lData = {
            id: null, type: null, order: { id: pOrder.id, customerid: pOrder.customerid, customer: pOrder.customer }, price: pOrder.price, currencynm: pOrder.currencynm, invoicetext: pOrder.invoicetext
        };

        $scope.detail(lData);
    }

    $scope.new = function () {
        var l_customers; 
        // get customer id and name to l_customers[0]
        if ($scope.parentControllerName == 'pcm_ordercontroller') {
            l_orders = $rootScope.getSelectedRows($scope.parent.listid, $rootScope.iot_devices);
            if (l_orders.length != 1) {
                alert('Select exactly one Order');
                console.error('error', 'invalid number of records');
                return;
            }
            $scope.i_new(l_orders[0]);
        }
        else
            if ($scope.parentControllerName == 'pcm_ordereditcontroller') {
                l_orders = [{
                    id: $scope.parent.dataCopy.id,
                    customerid: $scope.parent.dataCopy.customerid, 
                    customer: $scope.parent.dataCopy.customer, 
                    invoicetext: $scope.parent.dataCopy.invoicetext, 
                    price: $scope.parent.dataCopy.price, 
                    currencynm: $scope.parent.dataCopy.currencynm
                }];
                $scope.i_new(l_orders[0]);
            } else { /* call customer lookup */
                $rootScope.entitySelect('pcm_order', false).then(function (l_orders) {
                    $scope.i_new(l_orders[0]);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "New Invoice", "No order selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'new', error);
                });
            };
    }

    $scope.edit = function () {
        lData = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);
        if (lData.length != 1) {
            $rootScope.showalert("error", "Edit", "Select exactly one record!", "OK")
            return;
        }

        $scope.detail(lData[0]);
    };

    $scope.save = function (container) {

        container.type = parseInt(container.type);
        if (!container.orderid)
            if (container.order) 
                container.orderid = container.order.id;
            
        var l_container = angular.copy(container); 
        if (l_container.order)
            delete l_container['order'];
        if (l_container.customer)
            delete l_container['customer'];

        if (l_container.eventdatedate)
            l_container.eventdate = l_container.eventdatedate.toJSON();
        else
            l_container.eventdate = null;
        if (l_container.sentdate)
            l_container.sent = l_container.sentdate.toJSON();
        else
            l_container.sent = null;
        if (l_container.duedate)
            l_container.due = l_container.duedate.toJSON();
        else
            l_container.due = null;
        if (l_container.accepteddate)
            l_container.accepted = l_container.accepteddate.toJSON();
        else
            l_container.accepted = null;
        if (l_container.paiddate)
            l_container.paid = l_container.paiddate.toJSON();
        else
            l_container.paid = null;
        if (l_container.canceleddate)
            l_container.canceled = l_container.canceleddate.toJSON();
        else
            l_container.canceled = null;

        if (container.id) {
            //UPDATE

            // update main entity
            var l_containerupdate = angular.copy(l_container);
            // delete l_containerupdate['photodocument'];   // delete fields not fitting to main object entity
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/iot_device/" + l_containerupdate.id,
                withCredentials: true,
                method: 'PUT',
                datatype: "json",
                data: JSON.stringify(l_containerupdate)
            })
                .then(function success(response) {
                    $rootScope.model_iot_device.loadRecord(container.index);                    // replace with update / insert / delete all updated records
                    //                        $scope.loadData();  // refresh data if necessary (data could be changed by API) 
                }, function error(error) {
                    $rootScope.showerror($scope, 'save.update', error);
                });


        }
        else {
            // create a container without "id" field
            delete l_container['id'];
            if (l_container.customer)
                delete l_container['customer'];

            if (l_container.order)
               delete l_container['order'];

            var xjson = JSON.stringify(l_container);

            //INSERT
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/iot_device",
                withCredentials: true,
                method: 'POST',
                datatype: "json",
                data: xjson
            })
                .then(function success(response) {
                    $scope.loadData(true);  // replace with insert all created records
                }, function error(error) {
                    $rootScope.showerror($scope, 'save.insert', error);
                });
        }

    }

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
            $scope.save(container)
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
        var promise1 = function () {
            var promises = [];
            angular.forEach(lItems, function (item, index) {

                var promise2 = $http({
                    headers: { "Content-Type": "application/json" },
                    url: $rootScope.ApiAddress + "api/iot_device/" + item.id,
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
            $scope.loadData(true);
        });     
    };

    $scope.refreshdetail = function () {
        $scope.selectediot_device = null;

        l_selecteddata = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);
        if (l_selecteddata.length != 1) {
            return;
        }

//        console.log("refreshdetail", l_selecteddata);
//        console.log("parent.listid", $scope.parent.listid);

        $scope.selectediot_device = l_selecteddata[0];
    };

    if ($scope.parentControllerName == "iot_deviceeditcontroller")
        $scope.displaymasterdevices = "SELECTED";
    else if ($scope.parentControllerName == "iot_devicecontroller")
        $scope.displaymasterdevices = "SELECTED+";
    else
        $scope.displaymasterdevices = "ALL";
    $scope.displaymasterdevicesoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to seleted devices" },
        { Value: "SELECTED", Text: "Connected to seleted devices" },
        { Value: "NULL", Text: "Not connected to devices" }
    ];

    $scope.selectediot_device = null;
    $scope.loadData();
    $rootScope.kerReftabInit();
});

app.controller('iot_deviceeditcontroller', function ($scope, $uibModalInstance, container, $uibModal, $rootScope, ker_reference) {
    $scope.controllerName = 'iot_deviceeditcontroller';
    $scope.packageName = $scope.controllerName;

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

    $rootScope.kerReftabGetList('CURRENCY')
        .then(function (result) {
            $scope.currencylist = result[0];
            console.log("currencylist", $scope.currencylist);
        });

    $scope.objectData = container;
    $rootScope.iot_devicesCopy = angular.copy($scope.objectData);

    $scope.popupeventdate = { opened: false }; // initialize datapicker for fromdate
    $scope.popupsent = { opened: false }; // initialize datapicker for fromdate
    $scope.popupaccepted = { opened: false }; // initialize datapicker for fromdate
    $scope.popupdue = { opened: false }; // initialize datapicker for fromdate
    $scope.popuppaid = { opened: false }; // initialize datapicker for fromdate
    $scope.popupcanceled = { opened: false }; // initialize datapicker for fromdate

    $scope.ok = function () {
        angular.forEach($rootScope.iot_devicesCopy, function (value, key) {
            $scope.objectData[key] = value;
        });

        $uibModalInstance.close($scope.objectData);
    };

    $scope.cancel = function () {        
        angular.forEach($scope.objectData, function (value, key) {
            $rootScope.iot_devicesCopy[key] = value;
        });

        $uibModalInstance.dismiss('cancel');
    };

    $scope.openeventdate = function () { // open datapicker for fromdate
        $scope.popupeventdate.opened = true;
    };
    $scope.opensent = function () { // open datapicker for fromdate
        $scope.popupsent.opened = true;
    };
    $scope.openaccepted = function () { // open datapicker for fromdate
        $scope.popupaccepted.opened = true;
    };
    $scope.opendue = function () { // open datapicker for fromdate
        $scope.popupdue.opened = true;
    };
    $scope.openpaid = function () { // open datapicker for fromdate
        $scope.popuppaid.opened = true;
    };
    $scope.opencanceled = function () { // open datapicker for fromdate
        $scope.popupcanceled.opened = true;
    };
    
});

app.controller('iot_deviceselectcontroller', function ($scope, $uibModalInstance, $rootScope, $http, guialert, multiline, multilineallowed, ker_reference) {   
    $scope.controllerName = 'iot_deviceselectcontroller';
    $scope.packageName = $scope.controllerName;

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

    $scope.getcustomer = function (deviceindex) {
        if (!$rootScope.iot_devices[deviceindex].order) {
            $rootScope.iot_devices[deviceindex].customer = null;
            return;
        }
        if (!$rootScope.iot_devices[deviceindex].order.customerid) {
            $rootScope.iot_devices[deviceindex].order.customer = null;
            return;
        }

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_customer/" + $rootScope.iot_devices[deviceindex].order.customerid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $rootScope.iot_devices[deviceindex].customerid);
                //                console.log("id", $rootScope.iot_devices[deviceindex].id);
                $rootScope.iot_devices[deviceindex].order.customer = response.data;

            }, function error(error) {
                $rootScope.showerror($scope, 'getcustomer', error);
                $rootScope.iot_devices[deviceindex].order.customer = null;
            });
    };

    $scope.getorder = function (deviceindex) {
        if (!$rootScope.iot_devices[deviceindex].orderid) {
            $rootScope.iot_devices[deviceindex].order = null;
            return;
        }

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_order/" + $rootScope.iot_devices[deviceindex].orderid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_devices[deviceindex].order = response.data;
                $scope.getcustomer(deviceindex);
            }, function error(error) {
                $rootScope.showerror($scope, 'getorder', error);
                $rootScope.iot_devices[deviceindex].order = null;
            });
    };

    $scope.getpayments = function (deviceindex) {

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_payment/invoiceid/" + $rootScope.iot_devices[deviceindex].id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $rootScope.iot_devices[caleventid].customerid);
                //                console.log("id", $rootScope.iot_devices[caleventid].id);                
                //               console.log("ordersessions", response.data);                
                $rootScope.iot_devices[deviceindex].payments = response.data;
            }, function error(error) {
                $rootScope.showerror($scope, 'getpayments', error);
                $rootScope.iot_devices[deviceindex].payments = null;
            });
    };


    $scope.postimport = function (pIndex) {
        var item = $rootScope.iot_devices[pIndex];
        $rootScope.iot_devices[pIndex].index = pIndex;
        $scope.getorder(pIndex);
        $scope.getpayments(pIndex);

        if (item.eventdate) {
            $rootScope.iot_devices[pIndex].eventdate = item.eventdate + "Z";
            $rootScope.iot_devices[pIndex].eventdatedate = new Date(item.eventdate);
        } else
            $rootScope.iot_devices[pIndex].eventdatedate = null;

        if (item.sent) {
            $rootScope.iot_devices[pIndex].sent = item.sent + "Z";
            $rootScope.iot_devices[pIndex].sentdate = new Date(item.sent);
        } else
            $rootScope.iot_devices[pIndex].sentdate = null;
        if (item.due) {
            $rootScope.iot_devices[pIndex].due = item.due + "Z";
            $rootScope.iot_devices[pIndex].duedate = new Date(item.due);
        } else
            $rootScope.iot_devices[pIndex].duedate = null;
        if (item.accepted) {
            $rootScope.iot_devices[pIndex].accepted = item.accepted + "Z";
            $rootScope.iot_devices[pIndex].accepteddate = new Date(item.accepted);
        } else
            $rootScope.iot_devices[pIndex].accepteddate = null;
        if (item.paid) {
            $rootScope.iot_devices[pIndex].paid = item.paid + "Z";
            $rootScope.iot_devices[pIndex].paiddate = new Date(item.paid);
        } else
            $rootScope.iot_devices[pIndex].paiddate = null;
        if (item.canceled) {
            $rootScope.iot_devices[pIndex].canceled = item.canceled + "Z";
            $rootScope.iot_devices[pIndex].canceleddate = new Date(item.canceled);
        } else
            $rootScope.iot_devices[pIndex].canceleddate = null;
    }

    $scope.loadData = function () {
//        console.log("loaddata - pcm:", $scope.parentControllerName)
        $rootScope.iot_devices = null;
        $scope.selectediot_device = null;
        $rootScope.resetSelection($scope.listid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/iot_device",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $rootScope.iot_devices = response.data;

                $rootScope.resetSelection($scope.listid);
                angular.forEach($rootScope.iot_devices, function (item, lIndex) {
                    $rootScope.model_iot_device.postImport(pIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };


    $scope.filterOrders = function (item) {
        var dispfield = document.getElementById('displaymasterdevices.' + $scope.parentControllerName);
        if (!dispfield)
            return true;

        $scope.displaymasterdevices = dispfield.value;
        //console.log("displaycustomers", $scope.displayicustomers);

        if ($scope.displaymasterdevices == 'ALL') {
            return true;
        }
        if ($scope.displaymasterdevices == 'ANY') {
            if (!item.order)
                return false;
            else
                return true;
        }
        if ($scope.displaymasterdevices == 'NULL') {
            if (!item.order)
                return true;
            else
                return false;
        }
    };


    $scope.ok = function () {
        lContainer = $rootScope.getSelectedRows($scope.listid, $rootScope.iot_devices);
        $uibModalInstance.close(lContainer);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.displaymasterdevices = "ALL";
    $scope.displaymasterdevicesoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "ANY", Text: "Connected to any order" },
        { Value: "NULL", Text: "Not connected to orders" }
    ];

    $scope.loadData();
    $rootScope.kerReftabInit();
});

