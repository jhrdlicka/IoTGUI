/**
 * pcm_invoice list
 */
app.controller('pcm_invoicecontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert) {
    $scope.controllerName = 'pcm_invoicecontroller';
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

    $scope.getcustomer = function (invoiceindex) {
        if (!$scope.pcm_invoices[invoiceindex].order) {
            $scope.pcm_invoices[invoiceindex].customer = null;
            return;
        }
        if (!$scope.pcm_invoices[invoiceindex].order.customerid) {
            $scope.pcm_invoices[invoiceindex].order.customer = null;
            return;
        }

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_customer/" + $scope.pcm_invoices[invoiceindex].order.customerid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $scope.pcm_invoices[invoiceindex].customerid);
                //                console.log("id", $scope.pcm_invoices[invoiceindex].id);
                $scope.pcm_invoices[invoiceindex].order.customer = response.data;

            }, function error(error) {
                    $rootScope.showerror($scope, 'getcustomer', error);
                    $scope.pcm_invoices[invoiceindex].order.customer = null;
            });
    };

    $scope.getorder = function (invoiceindex) {
        if (!$scope.pcm_invoices[invoiceindex].orderid) {
            $scope.pcm_invoices[invoiceindex].order = null;
            return;
        }

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_order/" + $scope.pcm_invoices[invoiceindex].orderid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_invoices[invoiceindex].order = response.data;
                $scope.getcustomer(invoiceindex);
            }, function error(error) {
                $rootScope.showerror($scope, 'getorder', error);
                $scope.pcm_invoices[invoiceindex].order = null;
            });
    };

    $scope.getpayments = function (invoiceindex) {

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_payment/invoiceid/" + $scope.pcm_invoices[invoiceindex].id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $scope.pcm_invoices[caleventid].customerid);
                //                console.log("id", $scope.pcm_invoices[caleventid].id);                
                //               console.log("ordersessions", response.data);                
                $scope.pcm_invoices[invoiceindex].payments = response.data;
            }, function error(error) {
                $rootScope.showerror($scope, 'getpayments', error);
                $scope.pcm_invoices[invoiceindex].payments = null;
            });
    };

    $scope.postimport = function (pIndex) {
        var item = $scope.pcm_invoices[pIndex];
        $scope.pcm_invoices[pIndex].index = pIndex;
        $scope.getorder(pIndex);
        $scope.getpayments(pIndex);

        if (item.eventdate) {
            $scope.pcm_invoices[pIndex].eventdate = item.eventdate + "Z";
            $scope.pcm_invoices[pIndex].eventdatedate = new Date(item.eventdate);
        } else
            $scope.pcm_invoices[pIndex].eventdatedate = null;

        if (item.sent) {
            $scope.pcm_invoices[pIndex].sent = item.sent + "Z";
            $scope.pcm_invoices[pIndex].sentdate = new Date(item.sent);
        } else
            $scope.pcm_invoices[pIndex].sentdate = null;
        if (item.accepted) {
            $scope.pcm_invoices[pIndex].accepted = item.accepted + "Z";
            $scope.pcm_invoices[pIndex].accepteddate = new Date(item.accepted);
        } else
            $scope.pcm_invoices[pIndex].accepteddate = null;
        if (item.paid) {
            $scope.pcm_invoices[pIndex].paid = item.paid + "Z";
            $scope.pcm_invoices[pIndex].paiddate = new Date(item.paid);
        } else
            $scope.pcm_invoices[pIndex].paiddate = null;
        if (item.canceled) {
            $scope.pcm_invoices[pIndex].canceled = item.canceled + "Z";
            $scope.pcm_invoices[pIndex].canceleddate = new Date(item.canceled);
        } else
            $scope.pcm_invoices[pIndex].canceleddate = null;
    }

    $scope.loadData = function () {
//        console.log("loaddata - pcm:", $scope.parentControllerName)
        $scope.pcm_invoices = null;
        $scope.selectedpcm_invoice = null;
        $rootScope.resetSelection($rootScope.invoicelistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_invoice",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_invoices = response.data;

                $rootScope.resetSelection($rootScope.invoicelistid);
                angular.forEach($scope.pcm_invoices, function (item, lIndex) {
                    $scope.postimport(lIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };

    $scope.loadRecord = function (pIndex) {
        l_id = $scope.pcm_invoices[pIndex].id;
        $scope.pcm_invoices[pIndex] = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_invoice/" + l_id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_invoices[pIndex] = response.data;
                $scope.postimport(pIndex);               
            }, function error(error) {
                $rootScope.showerror($scope, 'loadRecord', error);
            });

    };


    $scope.filterOrders = function (item) {
        var dispordfield = document.getElementById('displayiorders.' + $scope.parentControllerName);
        if (!dispordfield)
            return true;

        $scope.displayiorders = dispordfield.value;
        //console.log("displaycustomers", $scope.displayicustomers);

        if ($scope.displayiorders == 'ALL') {
            return true;
        }
        if (!item.order) {
            //console.log("order not found", item.id);

            if ($scope.displayiorders == 'SELECTED+' || $scope.displayiorders == 'NULL')
                return true;
            else
                return false;
        }

        if ($scope.displayiorders == 'NULL')
            return false;

        if ($scope.parentControllerName == 'pcm_ordercontroller') {
            l_orders = $rootScope.getSelectedRows($rootScope.orderlistid, $scope.parent.pcm_orders);
        }
        else
            if ($scope.parentControllerName == 'pcm_ordereditcontroller') {
                l_orders = {
                    order: {
                        id: $scope.parent.dataCopy.id
                    }
                };

            } else {
                l_orders = null;
            }


        l_result = false;
        angular.forEach(l_orders, function (order, index) {
            if (order.id == item.order.id) {
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

    $scope.filterCustomers = function (item) {
        var dispcustfield = document.getElementById('displayicustomers.' + $scope.parentControllerName);
        if (!dispcustfield)
            return true;

        $scope.displayicustomers = dispcustfield.value;
//        console.log("item", item)
//        console.log("parentControllername", $scope.parentControllerName);
//        console.log("displaycustomers", $scope.displayicustomers);

        if ($scope.displayicustomers == 'ALL') {
            return true;
        }
        if ((!item.order) || (!item.order.customer)) {
            //console.log("customer not found", item.id);

            if ($scope.displayicustomers == 'SELECTED+' || $scope.displayicustomers == 'NULL')
                return true;
            else
                return false;
        }

        if ($scope.displayicustomers == 'NULL')
            return false;

        if ($scope.parentControllerName == 'pcm_customercontroller') {
            l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.parent.pcm_customers);
        }
        else if ($scope.parentControllerName == 'pcm_customereditcontroller') {
                l_customers = {
                    customer: {
                        id: $scope.parent.dataCopy.id
                    }
                };
        }
        else if ($scope.parentControllerName == 'pcm_ordercontroller') {  
            if ($scope.parent.parentControllerName == 'pcm_customercontroller') { // docked to orders within a client list 
                l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.parent.parent.pcm_customers);
            }
            else if ($scope.parent.parentControllerName == 'pcm_customereditcontroller') {  // docked to orders within a client detail
                l_customers = {
                    customer: {
                        id: $scope.parent.parent.dataCopy.id
                    }
                };
            }
            else                              // docked to top-level order-list
            {
                l_orders = $rootScope.getSelectedRows($rootScope.orderlistid, $scope.parent.pcm_orders);
                var l_customers = [];
                angular.forEach(l_orders, function (order, index) {
                    if (order.customer) {
                        l_customers.push({ id: order.customer.id });
                    }
                });
            }
        }
        else {
            l_customers = null;
        }


        l_result = false;
        angular.forEach(l_customers, function (customer, index) {
            if (customer.id == item.order.customer.id) {
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


    function i_pcm_connecttoorder(pOrders) {
        l_invoices = $rootScope.getSelectedRows($rootScope.invoicelistid, $scope.pcm_invoices);

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

    $scope.pcm_connecttoorder = function () {


        if ($scope.parentControllerName == 'pcm_ordercontroller') {
            l_orders = $rootScope.getSelectedRows($rootScope.orderlistid, $scope.parent.pcm_orders);
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
            l_orders = $rootScope.getSelectedRows($rootScope.orderlistid, $scope.parent.pcm_orders);
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
        lData = $rootScope.getSelectedRows($scope.invoicelistid, $scope.pcm_invoices);
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
        if (l_container.eventdatedate)
            l_container.eventdate = l_container.eventdatedate.toJSON();
        else
            l_container.eventdate = null;
        if (l_container.sentdate)
            l_container.sent = l_container.sentdate.toJSON();
        else
            l_container.sent = null;
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
                url: $rootScope.ApiAddress + "api/pcm_invoice/" + l_containerupdate.id,
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
            if (l_container.customer)
                delete l_container['customer'];

            if (l_container.order)
               delete l_container['order'];

            var xjson = JSON.stringify(l_container);

            //INSERT
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_invoice",
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
            templateUrl: 'views/partials/pcm_invoiceedit.html',
            controller: 'pcm_invoiceeditcontroller',
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
        lItems = $rootScope.getSelectedRows($scope.invoicelistid, $scope.pcm_invoices);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Invoice(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Delete Invoice(s)", "Delete " + lItems.length + " records?"))
            return;

        angular.forEach(lItems, function (item, index) {

            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_invoice/" + item.id,
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
        $scope.selectedpcm_invoice = null;

        l_selecteddata = $rootScope.getSelectedRows($scope.invoicelistid, $scope.pcm_invoices);
        if (l_selecteddata.length != 1) {
            return;
        }

        $scope.selectedpcm_invoice = l_selecteddata[0];
    };

    if ($scope.parentControllerName == "pcm_customereditcontroller")
        $scope.displayicustomers = "SELECTED";
    else if ($scope.parentControllerName == "pcm_customercontroller")
        $scope.displayicustomers = "SELECTED+";
    else if ($scope.parentControllerName == "pcm_ordereditcontroller")
        $scope.displayicustomers = "SELECTED";
    else if ($scope.parentControllerName == "pcm_ordercontroller") {
        if ($scope.parent.parentControllerName == "pcm_ordercontroller")
            $scope.displayicustomers = "SELECTED+";
        else
            $scope.displayicustomers = "ALL";
    }
    else
        $scope.displayicustomers = "ALL";
    $scope.displayicustomersoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to seleted customers" },
        { Value: "SELECTED", Text: "Connected to seleted customers" },
        { Value: "NULL", Text: "Not connected to customers" }
    ];

    if ($scope.parentControllerName == "pcm_customereditcontroller")
        $scope.displayiorders = "ALL";
    else if ($scope.parentControllerName == "pcm_customercontroller")
        $scope.displayiorders = "ALL";
    else if ($scope.parentControllerName == "pcm_ordereditcontroller")
        $scope.displayiorders = "SELECTED";
    else if ($scope.parentControllerName == "pcm_ordercontroller")
        $scope.displayiorders = "SELECTED+";
    else
        $scope.displayiorders = "ALL";
    $scope.displayiordersoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to seleted orders" },
        { Value: "SELECTED", Text: "Connected to seleted orders" },
        { Value: "NULL", Text: "Not connected to orders" }
    ];


    $scope.selectedpcm_invoice = null;
    $scope.loadData();


});

app.controller('pcm_invoiceeditcontroller', function ($scope, $uibModalInstance, container, $uibModal) {
    $scope.controllerName = 'pcm_invoiceeditcontroller';

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
    
    $scope.currencylist = [
        { Value: null, Text: "--Currency--" },
        { Value: "CZK", Text: "CZK" },
        { Value: "EUR", Text: "EUR" },
        { Value: "USD", Text: "USD" }
    ];

    $scope.objectData = container;
    $scope.dataCopy = angular.copy($scope.objectData);

    $scope.popupeventdate = { opened: false }; // initialize datapicker for fromdate
    $scope.popupsent = { opened: false }; // initialize datapicker for fromdate
    $scope.popupaccepted = { opened: false }; // initialize datapicker for fromdate
    $scope.popuppaid = { opened: false }; // initialize datapicker for fromdate
    $scope.popupcanceled = { opened: false }; // initialize datapicker for fromdate

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

    $scope.openeventdate = function () { // open datapicker for fromdate
        $scope.popupeventdate.opened = true;
    };
    $scope.opensent = function () { // open datapicker for fromdate
        $scope.popupsent.opened = true;
    };
    $scope.openaccepted = function () { // open datapicker for fromdate
        $scope.popupaccepted.opened = true;
    };
    $scope.openpaid = function () { // open datapicker for fromdate
        $scope.popuppaid.opened = true;
    };
    $scope.opencanceled = function () { // open datapicker for fromdate
        $scope.popupcanceled.opened = true;
    };
    
});

app.controller('pcm_invoiceselectcontroller', function ($scope, $uibModalInstance, $rootScope, $http, guialert, multiline, multilineallowed) {   
    $scope.controllerName = 'pcm_invoiceselectcontroller';
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

    $scope.getcustomer = function (invoiceindex) {
        if (!$scope.pcm_invoices[invoiceindex].order) {
            $scope.pcm_invoices[invoiceindex].customer = null;
            return;
        }
        if (!$scope.pcm_invoices[invoiceindex].order.customerid) {
            $scope.pcm_invoices[invoiceindex].order.customer = null;
            return;
        }

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_customer/" + $scope.pcm_invoices[invoiceindex].order.customerid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $scope.pcm_invoices[invoiceindex].customerid);
                //                console.log("id", $scope.pcm_invoices[invoiceindex].id);
                $scope.pcm_invoices[invoiceindex].order.customer = response.data;

            }, function error(error) {
                $rootScope.showerror($scope, 'getcustomer', error);
                $scope.pcm_invoices[invoiceindex].order.customer = null;
            });
    };

    $scope.getorder = function (invoiceindex) {
        if (!$scope.pcm_invoices[invoiceindex].orderid) {
            $scope.pcm_invoices[invoiceindex].order = null;
            return;
        }

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_order/" + $scope.pcm_invoices[invoiceindex].orderid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_invoices[invoiceindex].order = response.data;
                $scope.getcustomer(invoiceindex);
            }, function error(error) {
                $rootScope.showerror($scope, 'getorder', error);
                $scope.pcm_invoices[invoiceindex].order = null;
            });
    };

    $scope.getpayments = function (invoiceindex) {

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_payment/invoiceid/" + $scope.pcm_invoices[invoiceindex].id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $scope.pcm_invoices[caleventid].customerid);
                //                console.log("id", $scope.pcm_invoices[caleventid].id);                
                //               console.log("ordersessions", response.data);                
                $scope.pcm_invoices[invoiceindex].payments = response.data;
            }, function error(error) {
                $rootScope.showerror($scope, 'getpayments', error);
                $scope.pcm_invoices[invoiceindex].payments = null;
            });
    };


    $scope.postimport = function (pIndex) {
        var item = $scope.pcm_invoices[pIndex];
        $scope.pcm_invoices[pIndex].index = pIndex;
        $scope.getorder(pIndex);
        $scope.getpayments(pIndex);

        if (item.eventdate) {
            $scope.pcm_invoices[pIndex].eventdate = item.eventdate + "Z";
            $scope.pcm_invoices[pIndex].eventdatedate = new Date(item.eventdate);
        } else
            $scope.pcm_invoices[pIndex].eventdatedate = null;

        if (item.sent) {
            $scope.pcm_invoices[pIndex].sent = item.sent + "Z";
            $scope.pcm_invoices[pIndex].sentdate = new Date(item.sent);
        } else
            $scope.pcm_invoices[pIndex].sentdate = null;
        if (item.accepted) {
            $scope.pcm_invoices[pIndex].accepted = item.accepted + "Z";
            $scope.pcm_invoices[pIndex].accepteddate = new Date(item.accepted);
        } else
            $scope.pcm_invoices[pIndex].accepteddate = null;
        if (item.paid) {
            $scope.pcm_invoices[pIndex].paid = item.paid + "Z";
            $scope.pcm_invoices[pIndex].paiddate = new Date(item.paid);
        } else
            $scope.pcm_invoices[pIndex].paiddate = null;
        if (item.canceled) {
            $scope.pcm_invoices[pIndex].canceled = item.canceled + "Z";
            $scope.pcm_invoices[pIndex].canceleddate = new Date(item.canceled);
        } else
            $scope.pcm_invoices[pIndex].canceleddate = null;
    }

    $scope.loadData = function () {
//        console.log("loaddata - pcm:", $scope.parentControllerName)
        $scope.pcm_invoices = null;
        $scope.selectedpcm_invoice = null;
        $rootScope.resetSelection($rootScope.invoicelistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_invoice",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_invoices = response.data;

                $rootScope.resetSelection($rootScope.invoicelistid);
                angular.forEach($scope.pcm_invoices, function (item, lIndex) {
                    $scope.postimport(lIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };


    $scope.filterOrders = function (item) {
        var dispordfield = document.getElementById('displayiorders.' + $scope.parentControllerName);
        if (!dispordfield)
            return true;

        $scope.displayiorders = dispordfield.value;
        //console.log("displaycustomers", $scope.displayicustomers);

        if ($scope.displayiorders == 'ALL') {
            return true;
        }
        if ($scope.displayiorders == 'ANY') {
            if (!item.order)
                return false;
            else
                return true;
        }
        if ($scope.displayiorders == 'NULL') {
            if (!item.order)
                return true;
            else
                return false;
        }
    };


    $scope.ok = function () {
        lContainer = $rootScope.getSelectedRows($rootScope.invoiceselectlistid, $scope.pcm_invoices);
        $uibModalInstance.close(lContainer);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.displayiorders = "ALL";
    $scope.displayiordersoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "ANY", Text: "Connected to any order" },
        { Value: "NULL", Text: "Not connected to orders" }
    ];

    $scope.loadData();



});

