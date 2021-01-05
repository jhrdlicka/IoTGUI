/**
 * pcm_order list
 */
app.controller('pcm_ordercontroller', function ($scope, $http, $uibModal, $rootScope, $q, multiline, guialert, ker_reference) {
    $scope.controllerName = 'pcm_ordercontroller';
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

    //console.log("controllerName:", $scope.controllerName);
    //console.log("parentControllerName:", $scope.parentControllerName);
    //console.log("parent:", $scope.parent.controllerName);


    $scope.getcustomer = function (orderindex) {
        if (!$scope.pcm_orders[orderindex].customerid) {
            $scope.pcm_orders[orderindex].customer = null;
            return;
        }

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_customer/" + $scope.pcm_orders[orderindex].customerid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $scope.pcm_orders[orderindex].customerid);
                //                console.log("id", $scope.pcm_orders[orderindex].id);
                $scope.pcm_orders[orderindex].customer = response.data;

            }, function error(error) {
                    $rootScope.showerror($scope, 'getcustomer', error);
                    $scope.pcm_orders[orderindex].customer = null;
            });
    };

    $scope.getxvalues = function (pIndex) {
        if (!pIndex)
            return;
        $scope.pcm_orders[pIndex].xfullyscheduled = false;

        if (!$scope.pcm_orders[pIndex].ordersessions) {
            $scope.pcm_orders[pIndex].xunits = null;
            $scope.pcm_orders[pIndex].xsessionsprice = null;
        } else {
            $scope.pcm_orders[pIndex].xunits = 0;
            $scope.pcm_orders[pIndex].xsessionsprice = 0;
            angular.forEach($scope.pcm_orders[pIndex].ordersessions, function (item, lIndex) {
                if (angular.isNumber($scope.pcm_orders[pIndex].xsessionsprice)) {
                    if (!item.calevent) {
                        $scope.pcm_orders[pIndex].xsessionsprice = '???';
                        $scope.pcm_orders[pIndex].xunits = '???';
                    }
                    $scope.pcm_orders[pIndex].xunits = $scope.pcm_orders[pIndex].xunits + (item.calevent.units ? item.calevent.units : 1);
                    $scope.pcm_orders[pIndex].xsessionsprice = $scope.pcm_orders[pIndex].xsessionsprice + (item.price ? item.price : (item.rate ? item.rate : $scope.pcm_orders[pIndex].rate) * (item.calevent.units ? item.calevent.units : 1));
                }
            });
        }

        $scope.pcm_orders[pIndex].xprice = $scope.pcm_orders[pIndex].price ? $scope.pcm_orders[pIndex].price : $scope.pcm_orders[pIndex].xsessionsprice;
        $scope.pcm_orders[pIndex].xfinalprice = $scope.pcm_orders[pIndex].xprice * (1 - ($scope.pcm_orders[pIndex].discount ? $scope.pcm_orders[pIndex].discount : 0));

        if ($scope.pcm_orders[pIndex].ordersessions.length >= $scope.pcm_orders[pIndex].sessions)
            $scope.pcm_orders[pIndex].xfullyscheduled = true;
    }

    $scope.getcalevent = function (pOrderindex, pOrdersessionindex) {
        $scope.pcm_orders[pOrderindex].xfullyscheduled = false;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_calevent/" + $scope.pcm_orders[pOrderindex].ordersessions[pOrdersessionindex].caleventid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_orders[orderindex].ordersessions = response.data;
                angular.forEach($scope.pcm_orders[pIndex].ordersessions, function (item, lIndex) {
                    $scope.getcalevent(orderindex, lIndex);
                });
                // az budou vsechny nactene...
                $scope.getxvalues(orderindex);

            }, function error(error) {
                $rootScope.showerror($scope, 'getordersessions', error);
                $scope.pcm_orders[orderindex].ordersessions = null;
            });
    };


    $scope.getordersessions = function (orderindex) {

        var promise1=$http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_ordersession/orderid/" + $scope.pcm_orders[orderindex].id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $scope.pcm_orders[caleventid].customerid);
                //                console.log("id", $scope.pcm_orders[caleventid].id);                
                //               console.log("ordersessions", response.data);                
                $scope.pcm_orders[orderindex].ordersessions = response.data;
                var promises = [];
                angular.forEach($scope.pcm_orders[orderindex].ordersessions, function (item, lIndex) {
                    $scope.pcm_orders[orderindex].ordersessions[lIndex].calevent = null;
                    var promise=$http({
                        headers: { "Content-Type": "application/json" },
                        url: $rootScope.ApiAddress + "api/pcm_calevent/" + item.caleventid,
                        withCredentials: true,
                        method: 'GET'
                    })
                        .then(function success(response2) {
                            $scope.pcm_orders[orderindex].ordersessions[lIndex].calevent = response2.data;
                            return response2.$promise; 
                        }, function error(error) {
                            $rootScope.showerror($scope, 'getordersessions.2', error);
                            $scope.pcm_orders[orderindex].ordersessions[lIndex].calevent = null;
                        });
                    promises.push(promise);
                });
                return $q.all(promises);                
            }, function error(error) {
                $rootScope.showerror($scope, 'getordersessions.1', error);
                $scope.pcm_orders[orderindex].ordersessions = null;
            });

        promise1.then(function (promiseArray) {
            $scope.getxvalues(orderindex);
        });  

    };


    $scope.loadData = function () {
        $scope.pcm_orders = null;
        $scope.selectedpcm_order = null;
        $rootScope.resetSelection($rootScope.orderlistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_order",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_orders = response.data;

                $rootScope.resetSelection($rootScope.orderlistid);
                angular.forEach($scope.pcm_orders, function (item, lIndex) {
                    $scope.pcm_orders[lIndex].index = lIndex;
                    $scope.getcustomer(lIndex);
                    $scope.getordersessions(lIndex);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };

    $scope.filterOrders = function (item) {
        var dispcustfield = document.getElementById('displayocustomers.' + $scope.parentControllerName);
        if (!dispcustfield)
            return true;

        $scope.displayocustomers = dispcustfield.value;
        //console.log("displaycustomers", $scope.displayocustomers);

        if ($scope.displayocustomers == 'ALL') {
            return true;
        }
        if (!item.customer) {
            //console.log("customer not found", item.id);

            if ($scope.displayocustomers == 'SELECTED+' || $scope.displayocustomers == 'NULL')
                return true;
            else
                return false;
        }

        if ($scope.displayocustomers == 'NULL')
            return false;

        if ($scope.parentControllerName == 'pcm_customercontroller') {
            l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.parent.pcm_customers);
        }
        else
            if ($scope.parentControllerName == 'pcm_customereditcontroller') {
                l_customers = {
                    customer: {
                        id: $scope.parent.dataCopy.id
                    }
                };

            } else {
                l_customers = null;
            }


        l_result = false;
        angular.forEach(l_customers, function (customer, index) {
            if (customer.id == item.customer.id) {
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

    function i_pcm_connecttocustomer(pCustomers) {
        l_orders = $rootScope.getSelectedRows($rootScope.orderlistid, $scope.pcm_orders);

        if (!confirm("Connect " + l_orders.length + " orders to client " + pCustomers[0].name + "?"))
            return;

        angular.forEach(l_orders, function (order, index) {
            if (order.customerid) {
                if (order.customerid == pCustomers[0].id)
                    return;
                if (!confirm("Order nr. " + order.id + " is already connected to client " + order.customer.name + ". Reconnect to " + pCustomers[0].name + "?"))
                    return;
            }

            order.customerid = pCustomers[0].id;
            order.customer = {id:pCustomers[0].id, name:pCustomers[0].name};
            $scope.save(order);
        });

    }

    $scope.pcm_connecttocustomer = function () {


        if ($scope.parentControllerName == 'pcm_customercontroller') {
            l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.parent.pcm_customers);
            if (l_customers.length != 1) {
                alert('Select exactly one Customer');
                console.error('error', 'invalid number of records');
                return;
            }
            i_pcm_connecttocustomer(l_customers);
        }
        else
            if ($scope.parentControllerName == 'pcm_customereditcontroller') {
                l_customers = [{
                    id: $scope.parent.dataCopy.id,
                    name: $scope.parent.dataCopy.name
                }];
                i_pcm_connecttocustomer(l_customers);

            } else { /* call customer lookup */
                $rootScope.entitySelect('pcm_customer', false).then(function (l_customers) {
                    i_pcm_connecttocustomer(l_customers);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "Connect Orders to Customer", "No customer selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'pcm_connectstocustomer', error);
                });
            }
    }


    $scope.i_new = function (pCustomer){
        // set id to null and other items to defaults
        var lData = {
            id: null, type: null, customer: { id: pCustomer.id, name: pCustomer.name }, rate: pCustomer.rate, currencynm: pCustomer.currencynm
        };

        $scope.detail(lData);
    }

    $scope.new = function () {
        var l_customers; 
        // get customer id and name to l_customers[0]
        if ($scope.parentControllerName == 'pcm_customercontroller') {
            l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.parent.pcm_customers);
            if (l_customers.length != 1) {
                alert('Select exactly one Customer');
                console.error('error', 'invalid number of records');
                return;
            }
            $scope.i_new(l_customers[0]);
        }
        else
            if ($scope.parentControllerName == 'pcm_customereditcontroller') {
                l_customers = [{
                    id: $scope.parent.dataCopy.id,
                    name: $scope.parent.dataCopy.name, 
                    rate: $scope.parent.dataCopy.rate, 
                    currencynm: $scope.parent.dataCopy.currencynm
                }];
                $scope.i_new(l_customers[0]);
            } else { /* call customer lookup */
                $rootScope.entitySelect('pcm_customer', false).then(function (l_customers) {
                    $scope.i_new(l_customers[0]);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "New Order", "No customer selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'new', error);
                });
            };
    }

    $scope.edit = function () {
        lData = $rootScope.getSelectedRows($scope.orderlistid, $scope.pcm_orders);
        if (lData.length != 1) {
            $rootScope.showalert("error", "Edit", "Select exactly one record!", "OK")
            return;
        }

        $scope.detail(lData[0]);
    };

    $scope.save = function (container) {

        container.type = parseInt(container.type);
        if (!container.customerid)
            if (container.customer) 
                container.customerid = container.customer.id;
            

        if (container.id) {
            //UPDATE

            var l_container = angular.copy(container);

            // update main entity
            var l_containerupdate = angular.copy(l_container);
            // delete l_containerupdate['photodocument'];   // delete fields not fitting to main object entity
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_order/" + l_containerupdate.id,
                withCredentials: true,
                method: 'PUT',
                datatype: "json",
                data: JSON.stringify(l_containerupdate)
            })
                .then(function success(response) {
                    $scope.getordersessions(container.index);
                    //                        $scope.loadData();  // refresh data if necessary (data could be changed by API)
                }, function error(error) {
                    $rootScope.showerror($scope, 'save.1', error);
                });


        }
        else {
            // create a container without "id" field
            var l_container = angular.copy(container); //Object.assign({}, container);
            delete l_container['id'];
            if (l_container.customer)
                delete l_container['customer'];

            var xjson = JSON.stringify(l_container);

            //INSERT
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_order",
                withCredentials: true,
                method: 'POST',
                datatype: "json",
                data: xjson
            })
                .then(function success(response) {
                    $scope.loadData();
                }, function error(error) {
                    $rootScope.showerror($scope, 'save.2', error);
                });
        }

    }

    $scope.detail = function (pData) {

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/pcm_orderedit.html',
            controller: 'pcm_ordereditcontroller',
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
        lItems = $rootScope.getSelectedRows($scope.orderlistid, $scope.pcm_orders);
        if (lItems.length == 0) {
            $rootScope.showalert("error", "Delete Order(s)", "No records selected!")
            return;
        }

        if (!$rootScope.showalert("confirm", "Delete Order(s)", "Delete " + lItems.length + " records?"))
            return;

        angular.forEach(lItems, function (item, index) {

            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_order/" + item.id,
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
        $scope.selectedpcm_order = null;

        l_selecteddata = $rootScope.getSelectedRows($scope.orderlistid, $scope.pcm_orders);
        if (l_selecteddata.length != 1) {
            return;
        }

        $scope.selectedpcm_order = l_selecteddata[0];
    };

    if ($scope.parentControllerName == "pcm_customereditcontroller")
        $scope.displayocustomers = "SELECTED";
    else if ($scope.parentControllerName == "pcm_customercontroller")
        $scope.displayocustomers = "SELECTED+";
    else
        $scope.displayocustomers = "ALL";
    $scope.displayocustomersoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to seleted customers" },
        { Value: "SELECTED", Text: "Connected to seleted customers" },
        { Value: "NULL", Text: "Not connected to customers" }
    ];


    $scope.selectedpcm_order = null;
    $scope.loadData();
    $rootScope.kerReftabInit();
});

app.controller('pcm_ordereditcontroller', function ($scope, $uibModalInstance, container, $uibModal, $rootScope, ker_reference) {
    $scope.controllerName = 'pcm_ordereditcontroller';

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

app.controller('pcm_orderselectcontroller', function ($scope, $uibModalInstance, $rootScope, $http, guialert, multiline, multilineallowed, ker_reference) {   
    $scope.controllerName = 'pcm_orderselectcontroller';
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


    $scope.filterOrders = function (item) {
        var dispcustfield = document.getElementById('displayocustomers.' + $scope.parentControllerName);
        if (!dispcustfield)
            return true;

        $scope.displayocustomers = dispcustfield.value;
        //console.log("displaycustomers", $scope.displayocustomers);

        if ($scope.displayocustomers == 'ALL') {
            return true;
        }
        if (!item.customer) {
            //console.log("customer not found", item.id);

            if ($scope.displayocustomers == 'SELECTED+' || $scope.displayocustomers == 'NULL')
                return true;
            else
                return false;
        }

        if ($scope.displayocustomers == 'NULL')
            return false;

        if ($scope.parentControllerName == 'pcm_customercontroller') {
            l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.parent.pcm_customers);
        }
        else
            if ($scope.parentControllerName == 'pcm_customereditcontroller') {
                l_customers = {
                    customer: {
                        id: $scope.parent.dataCopy.id
                    }
                };

            } else {
                l_customers = null;
            }


        l_result = false;
        angular.forEach(l_customers, function (customer, index) {
            if (customer.id == item.customer.id) {
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

    $scope.getcustomer = function (orderindex) {
        if (!$scope.pcm_orders[orderindex].customerid) {
            $scope.pcm_orders[orderindex].customer = null;
            return;
        }

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_customer/" + $scope.pcm_orders[orderindex].customerid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $scope.pcm_orders[orderindex].customerid);
                //                console.log("id", $scope.pcm_orders[orderindex].id);
                $scope.pcm_orders[orderindex].customer = response.data;

            }, function error(error) {
                $rootScope.showerror($scope, 'getcustomer', error);
                $scope.pcm_orders[orderindex].customer = null;
            });
    };

    $scope.getordersessions = function (orderindex) {
        $scope.pcm_orders[orderindex].xfullyscheduled = false;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_ordersession/orderid/" + $scope.pcm_orders[orderindex].id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                //                console.log("customerid", $scope.pcm_orders[caleventid].customerid);
                //                console.log("id", $scope.pcm_orders[caleventid].id);                
                //               console.log("ordersessions", response.data);                
                $scope.pcm_orders[orderindex].ordersessions = response.data;
                if ($scope.pcm_orders[orderindex].ordersessions.length >= $scope.pcm_orders[orderindex].sessions)
                    $scope.pcm_orders[orderindex].xfullyscheduled = true;

            }, function error(error) {
                $rootScope.showerror($scope, 'getordersessions', error);
                $scope.pcm_orders[orderindex].ordersessions = null;
            });
    };

    $scope.loadData = function () {
        $scope.pcm_orders = null;
        $rootScope.resetSelection($rootScope.orderselectlistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_order",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_orders = response.data;

                $rootScope.resetSelection($rootScope.orderselectlistid);
                angular.forEach($scope.pcm_orders, function (item, index) {
                    $scope.pcm_orders[index].index = index;
                    $scope.getcustomer(index);
                    $scope.getordersessions(index);
                });

            }, function error(error) {
                $rootScope.showerror($scope, 'loadData', error);
            });

    };

    $scope.ok = function () {
        lContainer = $rootScope.getSelectedRows($rootScope.orderselectlistid, $scope.pcm_orders);
        $uibModalInstance.close(lContainer);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    if ($scope.parentControllerName == "pcm_customereditcontroller")
        $scope.displayocustomers = "SELECTED";
    else if ($scope.parentControllerName == "pcm_customercontroller")
        $scope.displayocustomers = "SELECTED+";
    else
        $scope.displayocustomers = "ALL";
    $scope.displayocustomersoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to seleted customers" },
        { Value: "SELECTED", Text: "Connected to seleted customers" },
        { Value: "NULL", Text: "Not connected to customers" }
    ];

    $scope.loadData();
    $rootScope.kerReftabInit();
});

