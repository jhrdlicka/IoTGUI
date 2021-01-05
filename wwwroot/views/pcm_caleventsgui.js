/**
 * pcm_calevent list
 */
app.controller('pcm_caleventcontroller', function ($scope, $http, $uibModal, $cookies, $window, $rootScope, $filter, multiline, guialert, $q, ker_reference) {

    $scope.controllerName = 'pcm_caleventcontroller';
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

    $scope.timeDifference = function (start, end) {
        var l_base=new Date("2020-01-01T00:00:00+01:00");
        var l_diff = Math.abs(end - start);
        l_base.setMilliseconds(l_base.getMilliseconds() + l_diff);

        return l_base;
    }

    function initClient() {
        // Array of API discovery doc URLs for APIs used by the quickstart
        var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

        // Authorization scopes required by the API; multiple scopes can be
        // included, separated by spaces.
        var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

        var authorizeButton = document.getElementById('authorize_button');
        var signoutButton = document.getElementById('signout_button');

        gapi.client.init({
            apiKey: $rootScope.API_KEY,
            clientId: $rootScope.CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(function () {

            const googleAuth = gapi.auth2.getAuthInstance()

            if (googleAuth.isSignedIn.get()) {
                var profile = googleAuth.currentUser.get().getBasicProfile();
                //            console.log('ID: ' + profile.getId());
                //            console.log('Full Name: ' + profile.getName());
                //            console.log('Given Name: ' + profile.getGivenName());
                //            console.log('Family Name: ' + profile.getFamilyName());
                //            console.log('Image URL: ' + profile.getImageUrl());
                //            console.log('Email: ' + profile.getEmail());
                $scope.useremail = profile.getEmail();
            }

            // Listen for sign-in state changes.
            googleAuth.isSignedIn.listen(updateSigninStatus);

            // Handle the initial sign-in state.
            updateSigninStatus(googleAuth.isSignedIn.get());
            if (authorizeButton)
                authorizeButton.onclick = handleAuthClick;
            if (signoutButton)
                signoutButton.onclick = handleSignoutClick;
        }, function (error) {
            appendPre(JSON.stringify(error, null, 2));
        });
    }

    function updateSigninStatus(isSignedIn) {
        var authorizeButton = document.getElementById('authorize_button');
        var signoutButton = document.getElementById('signout_button');

        if (isSignedIn) {
            if (authorizeButton)
                authorizeButton.style.display = 'none';
            if (signoutButton)
                signoutButton.style.display = 'block';

            $scope.runimportCalEvents();
        } else {
            if (authorizeButton)
                authorizeButton.style.display = 'block';
            if (signoutButton)
                signoutButton.style.display = 'none';
        }
    }

    function handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
    }

    function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();

        $cookies.remove(".AspNetCore.Cookies");
        $rootScope.isAuthorized = false;

        const url = "http://accounts.google.com/Logout?redirectUrl=" + encodeURIComponent(window.location.href);
        window.open(url);
    }


    $scope.runimportGCalEvents = function () {

        $scope.pcm_gcalevents = null;
        $scope.selectedpcm_gcalevent = null;
        $rootScope.resetSelection($rootScope.gcaleventlistid);

        gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': true,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime'
        }).then(function (response) {
            $scope.pcm_gcalevents = response.result.items;
            angular.forEach($scope.pcm_gcalevents, function (item, index) {
                $scope.pcm_gcalevents[index].index = index;
                $scope.pcm_gcalevents[index].starttime = new Date(item.start.dateTime); //"2020-11-13T21:42:18.77"   "2020-11-27T08:00:00+01:00"
                $scope.pcm_gcalevents[index].totime = new Date(item.end.dateTime);
                $scope.pcm_gcalevents[index].durationtime = new Date();
                $scope.pcm_gcalevents[index].durationtime = $scope.timeDifference($scope.pcm_gcalevents[index].starttime, $scope.pcm_gcalevents[index].totime);
                $scope.pcm_gcalevents[index].gcaljson = JSON.stringify(item);
                $scope.pcm_gcalevents[index].participantlist = [];

                var i = 0;
                
                if (item.organizer) {
                    if (item.organizer.email != $scope.useremail) {
                        if (!item.organizer.displayName)
                            $scope.pcm_gcalevents[index].participantlist[0] = {
                                "displayname": '<' + item.organizer.email + '>',
                                "email": item.organizer.email
                            }
                        else
                            $scope.pcm_gcalevents[index].participantlist[0] = {
                                "displayname": '"' + item.organizer.displayName + '" <' + item.organizer.email + '>',
                                "email": item.organizer.email
                            };
                        i = 1;
                    };
                } else
                    item.organizer = { "email": "noemail" };
                                        
                angular.forEach(item.attendees, function (participant, index2) {
                    if ((participant.email != item.organizer.email) && (participant.email != $scope.useremail)) {
                        if (!participant.displayName)
                            $scope.pcm_gcalevents[index].participantlist[i] = {
                                "displayname": '<' + participant.email + '>',
                                "email": participant.email
                            }
                        else
                            $scope.pcm_gcalevents[index].participantlist[i] = {
                                "displayname": '"' + participant.displayName + '" <' + participant.email + '>',
                                "email": participant.email
                            }
                        i = i + 1;
                    }
                });
            });

            $scope.$apply()

        }, function error(error) {
            if (error.status == 401)
                alert("Access Denied!!!");
            else
                alert("Unknown Error!");
            console.error('error', error);
        });

    }

    $scope.getorderedsessions = function (caleventindex) {
        if (!$scope.pcm_calevents[caleventindex].ordersessions || $scope.pcm_calevents[caleventindex].ordersessions.length == 0)  // no attached orders
            return null;
        if ($scope.pcm_calevents[caleventindex].ordersessions.length == 1) {
            if (!$scope.pcm_calevents[caleventindex].ordersessions[0].order)
                return '???';
            else
                return $scope.pcm_calevents[caleventindex].ordersessions[0].xord + '/' + $scope.pcm_calevents[caleventindex].ordersessions[0].order.sessions;
        }
        else { // more orders attached to the calevent
            console.log('more ordersessions for a calevent', $scope.pcm_calevents[caleventindex])
            return '***';
        }
    }

    $scope.getinvoiced = function (caleventindex) {
        if (!$scope.pcm_calevents[caleventindex].ordersessions || $scope.pcm_calevents[caleventindex].ordersessions.length == 0)  // no attached orders
            return false;

        var lResult = true; // let's assume there is everything invoiced 
        angular.forEach($scope.pcm_calevents[caleventindex].ordersessions, function (calevent, ordersessionindex) {
            if (!$scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].order || !$scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].order.invoices) // order or invoices have not been fetched yet from the db
                lResult = false;
            else if ($scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].order.invoices.length == 0) // any order has not been invoiced yet
                lResult = false;
        });
        return lResult;
    };



    $scope.getcustomer = function (caleventindex) {
        if (!$scope.pcm_calevents[caleventindex].customerid) {
            $scope.pcm_calevents[caleventindex].customer = null;
            return;
        }

        var lId = $scope.pcm_calevents[caleventindex].id;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_customer/" + $scope.pcm_calevents[caleventindex].customerid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {                
                if (!$scope.pcm_calevents || !$scope.pcm_calevents[caleventindex] || $scope.pcm_calevents[caleventindex].id!=lId) {
//                    console.log("invalid pointer - probably double refresh (1)", caleventindex, lId, $scope.pcm_calevents);
                    return;
                }

                $scope.pcm_calevents[caleventindex].customer = response.data;

            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    alert("Unknown Error!");
                    console.error('error', error);
                    $scope.pcm_calevents[caleventindex].customer = null;
            });
    };

    $scope.getinvoices = function (caleventindex, ordersessionindex) {
        var lId = $scope.pcm_calevents[caleventindex].id;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_invoice/orderid/" + $scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].orderid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                if (!$scope.pcm_calevents || !$scope.pcm_calevents[caleventindex] || !$scope.pcm_calevents[caleventindex].ordersessions || !$scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex] || !$scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].order || $scope.pcm_calevents[caleventindex].id != lId) {
//                    console.log("invalid pointer - probably double refresh (2)", caleventindex, ordersessionindex, $scope.pcm_calevents);
                    return;
                }

                $scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].order.invoices = response.data;
            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    //                    alert("Unknown Error!");
                    console.error('error', error);
                $scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].order.invoices = null;
            });

    };

    $scope.getorder = function (caleventindex, ordersessionindex) {
        var lId = $scope.pcm_calevents[caleventindex].id;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_order/" + $scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].orderid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                if (!$scope.pcm_calevents || !$scope.pcm_calevents[caleventindex] || !$scope.pcm_calevents[caleventindex].ordersessions || !$scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex] || $scope.pcm_calevents[caleventindex].id != lId) {
//                    console.log("invalid pointer - probably double refresh (3)", caleventindex, ordersessionindex, $scope.pcm_calevents);
                    return;
                }
                $scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].order = response.data;  
                $scope.getinvoices(caleventindex, ordersessionindex); 
            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    //                    alert("Unknown Error!");
                    console.error('error', error);
                    $scope.pcm_calevents[caleventindex].ordersessions[ordersessionindex].order = null;
            });
    };

    $scope.getordersessions = function (caleventindex) {
        var lId = $scope.pcm_calevents[caleventindex].id;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_ordersession/caleventid/" + $scope.pcm_calevents[caleventindex].id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                if (!$scope.pcm_calevents || !$scope.pcm_calevents[caleventindex] || $scope.pcm_calevents[caleventindex].id != lId) {
//                    console.log("invalid pointer - probably double refresh (4)", caleventindex, $scope.pcm_calevents);
                    return;
                }

                $scope.pcm_calevents[caleventindex].ordersessions = response.data;
                angular.forEach($scope.pcm_calevents[caleventindex].ordersessions, function (calevent, ordersessionindex) {
                    $scope.getorder(caleventindex, ordersessionindex);
                });

            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
//                    alert("Unknown Error!");
                    console.error('error', error);
                    $scope.pcm_calevents[caleventindex].ordersessions = null;
            });
    };


    $scope.loadData = function () {

        gapi.load('client:auth2', initClient);

    }

    $scope.filterCaleventsByOrders = function (item) {
        var dispordfield = document.getElementById('displayorders.' + $scope.parentControllerName);
        if (!dispordfield)
            return true;
        $scope.displayorders = dispordfield.value;

        if ($scope.displayorders == 'ALL') {
            return true;
        }
        if (!item.ordersessions || item.ordersessions.length==0) {

            if ($scope.displayorders == 'SELECTED+' || $scope.displayorders == 'NULL') {
                return true;
            }
            else
                return false;
        }

        if ($scope.displayorders == 'NULL')
            return false;

        if  ($scope.$parent.controllerName == 'pcm_ordereditcontroller') {
            l_orders = {
                order: {
                    id: $scope.$parent.dataCopy.id
                }
            };
        } else if ($scope.$parent.controllerName == 'pcm_ordercontroller') {
            l_orders = $rootScope.getSelectedRows($rootScope.orderlistid, $scope.$parent.pcm_orders);
        } else {
            l_orders = null;
        }

        l_result = false;
        angular.forEach(l_orders, function (order, index) {
            l_ordersessions = $filter('filter')(item.ordersessions, { orderid: order.id });
            if (l_ordersessions.length>0) { 
                l_result = true;
                return true;
            }
        });

        return l_result;
    };


    $scope.filterCalevents = function (item) {
        var dispcustfield = document.getElementById('displaycustomers.' + $scope.parentControllerName);
        if (!dispcustfield) {
//            console.log("no calevent filter", item.id);
            return true;
        }

        $scope.displaycustomers = dispcustfield.value;
        //console.log("calevent filter", $scope.displaycustomers);

        if ($scope.displaycustomers == 'ALL') {
            return true;
        }
        if (!item.customer) {
            //console.log("customer not found", item.id);

            if ($scope.displaycustomers == 'SELECTED+' || $scope.displaycustomers == 'NULL')
                return true;
            else
                return false;
        }

        if ($scope.displaycustomers == 'NULL')
            return false;

        //console.log("controllerName", $scope.$parent.controllerName);
        if ($scope.parentControllerName == 'pcm_customercontroller') {
            l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.parent.pcm_customers);
        }
        else if ($scope.parentControllerName == 'pcm_customereditcontroller') {
                l_customers = {
                    customer: {
                        id: $scope.parent.dataCopy.id
                    }
                };
        } else if ($scope.parentControllerName == 'pcm_ordereditcontroller') {
                    l_customers = {
                        customer: {
                            id: $scope.parent.dataCopy.customer.id
                        }
                    };
        } else if ($scope.parentControllerName == 'pcm_ordercontroller') {
            if ($scope.parent.parentControllerName == 'pcm_customereditcontroller')  // docked to orders within a client detail 
                l_customers = {
                    customer: {
                        id: $scope.parent.parent.dataCopy.id
                    }
                };
            else if ($scope.parent.parentControllerName == 'pcm_customercontroller')  // docked to orders within a client list
                l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.parent.parent.pcm_customers);
            else {                                                                      // docked to top-level order-list
                l_orders = $rootScope.getSelectedRows($rootScope.orderlistid, $scope.parent.pcm_orders);
                var l_customers = [];
                angular.forEach(l_orders, function (order, index) {
                    if (order.customer) {
                        l_customers.push({ id: order.customer.id });
                    }
                });
            }
        } else{
            l_customers = null;
        }

        //console.log("customers", l_customers);


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

    $scope.filterGcalvents = function (item) {
        var dispcalfield = document.getElementById('displaycalevents.' + $scope.parentControllerName);
        $scope.displaycalevents = dispcalfield.value;
//        console.log('type', $scope.displaycalevents);

        if ($scope.displaycalevents == 'ALL') {
//            console.log('type', '1');
            return true;
        }

        // lets seaarch the calevent within selected calevents
        l_calevents = $rootScope.getSelectedRows($rootScope.caleventlistid, $scope.pcm_calevents);

        l_result = false;
        angular.forEach(l_calevents, function (calevent, index) {
            if (calevent.gcalid == item.id) {
                //                console.log("found", item.id);
                l_result = true;
                return true;
            }
        });

        // there exists any connected calevent from selected calevents
        if (l_result) {
//            console.log('type', '2');
            if ($scope.displaycalevents == 'NULL')
                return false;
            else
                return true;
        };

        // so the gcalevent is not found in seleted calevents


        if ($scope.displaycalevents == 'SELECTED') {
//            console.log('type', '3');
            return false;
        }

        // lets seaarch the calevent within all calevents

        angular.forEach($scope.pcm_calevents, function (calevent, index) {
            if (calevent.gcalid == item.id) {
                //                console.log("found", item.id);
                l_result = true;
                return true;
            }
        });

        // here the gcalevent is surely not between selected calevents so depends on calevents
        if (l_result) {
//            console.log('type', '4');
            if ($scope.displaycalevents == 'NULL')
                return false;
            else
                if ($scope.displaycalevents == 'SELECTED+')
                    return false;
                else
                    return true; // remains only type CONNECTED
        };

        // here the gcalevent is surely not between any calevents
        if ($scope.displaycalevents == 'NULL' || $scope.displaycalevents == 'SELECTED+') {
//            console.log('type', '5');
            return true;
        }

//        console.log('type', '6');
        return false;      
    };

    $scope.postimportCalEvent = function (index) {
        var item = $scope.pcm_calevents[index];
        $scope.pcm_calevents[index].index = index;
        //console.log("pcm_calevents", $scope.pcm_calevents);
        if (item.start)
            $scope.pcm_calevents[index].start = item.start + "Z";
        else
            $scope.pcm_calevents[index].start = null;
        $scope.pcm_calevents[index].starttime = new Date($scope.pcm_calevents[index].start);             
        $scope.pcm_calevents[index].totime = new Date(item.start);
        $scope.pcm_calevents[index].totime.setSeconds($scope.pcm_calevents[index].totime.getSeconds() + item.duration);
        $scope.pcm_calevents[index].durationtime = new Date();
        $scope.pcm_calevents[index].durationtime = $scope.timeDifference($scope.pcm_calevents[index].starttime, $scope.pcm_calevents[index].totime);
        if (!$scope.pcm_calevents[index].gcalid)
            $scope.pcm_calevents[index].gcalidflag = false;
        else
            $scope.pcm_calevents[index].gcalidflag = true;
        $scope.getordersessions(index);
        $scope.getcustomer(index);

        if (item.gcaljson) {
            $scope.pcm_calevents[index].gcaldata = JSON.parse(item.gcaljson);
            $scope.pcm_calevents[index].gcalsummary = $scope.pcm_calevents[index].gcaldata.summary;
            $scope.pcm_calevents[index].gcalcreated = new Date($scope.pcm_calevents[index].gcaldata.created);
            $scope.pcm_calevents[index].gcalupdated = new Date($scope.pcm_calevents[index].gcaldata.updated);
            $scope.pcm_calevents[index].gcalhtmllink = $scope.pcm_calevents[index].gcaldata.htmlLink;
            $scope.pcm_calevents[index].gcalstatus = $scope.pcm_calevents[index].gcaldata.status;
            if ($scope.pcm_calevents[index].gcaldata.description)
                $scope.pcm_calevents[index].gcaldescription = $scope.pcm_calevents[index].gcaldata.description;
            else
                $scope.pcm_calevents[index].gcaldescription = "";
            $scope.pcm_calevents[index].gcallocation = $scope.pcm_calevents[index].gcaldata.location;
            $scope.pcm_calevents[index].gcalstarttime = new Date($scope.pcm_calevents[index].gcaldata.start.dateTime);
            $scope.pcm_calevents[index].gcaltotime = new Date($scope.pcm_calevents[index].gcaldata.end.dateTime);
            $scope.pcm_calevents[index].gcaldurationtime = $scope.timeDifference($scope.pcm_calevents[index].gcalstarttime, $scope.pcm_calevents[index].gcaltotime);

            $scope.pcm_calevents[index].gcalparticipantlist = [];
            var i = 0;
            if (!$scope.pcm_calevents[index].gcaldata.organizer) {
                $scope.pcm_calevents[index].gcaldata.organizer = { "email": "noemail" };
            }
            else {
                if ($scope.pcm_calevents[index].gcaldata.organizer.email != $scope.useremail) {
                    if (!$scope.pcm_calevents[index].gcaldata.organizer.displayName) {
                        $scope.pcm_calevents[index].gcalparticipantlist[0] = {
                            "displayname": '<' + $scope.pcm_calevents[index].gcaldata.organizer.email + '>',
                            "email": $scope.pcm_calevents[index].gcaldata.organizer.email
                        };
                    }
                    else {
                        $scope.pcm_calevents[index].gcalparticipantlist[0] = {
                            "displayname": '"' + $scope.pcm_calevents[index].gcaldata.organizer.displayName + '" <' + $scope.pcm_calevents[index].gcaldata.organizer.email + '>',
                            "email": $scope.pcm_calevents[index].gcaldata.organizer.email
                        };
                    }
                    i = 1;
                }
            }
            angular.forEach($scope.pcm_calevents[index].gcaldata.attendees, function (participant, index2) {
                if (participant.email != $scope.pcm_calevents[index].gcaldata.organizer.email)
                    if (participant.email != $scope.useremail) {
                        if (!participant.displayName) {
                            $scope.pcm_calevents[index].gcalparticipantlist[i] = {
                                "displayname": '<' + participant.email + '>',
                                "email": participant.email
                            };
                        }
                        else {
                            $scope.pcm_calevents[index].gcalparticipantlist[i] = {
                                "displayname": '"' + participant.displayName + '" <' + participant.email + '>',
                                "email": participant.email
                            };
                        };
                        i = i + 1;
                    }
            });
        }
    }

    $scope.runimportCalEvents = function () {

        $scope.pcm_calevents = null;
        $scope.selectedpcm_calevent = null;
        $rootScope.resetSelection($rootScope.caleventlistid);

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_calevent",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_calevents = response.data;
                //console.log("pcm_calevents", $scope.pcm_calevents);
                angular.forEach($scope.pcm_calevents, function (item, index) {
                    $scope.postimportCalEvent(index);
                });

                $scope.runimportGCalEvents();

            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    alert("Unknown Error!");
                console.error('error', error);
            });
    };

    $scope.reloadrecord = function (index) {
        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_calevent/" +$scope.pcm_calevents[index].id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_calevents[index] = response.data;
                $scope.postimportCalEvent(index);
            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    alert("Unknown Error!");
                console.error('error', error);
            });
    }

    $scope.pcm_caleventsave = function (container) {
        container.type = parseInt(container.type);
        var l_container = angular.copy(container); 
        l_container.start = l_container.starttime.toJSON();
        l_container.duration = l_container.durationtime.getHours() * 60 * 60 + l_container.durationtime.getMinutes() * 60 + l_container.durationtime.getSeconds();
        l_json = JSON.stringify(l_container);

        if (container.id) {

            //UPDATE
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_calevent/" + l_container.id,
                withCredentials: true,
                method: 'PUT',
                datatype: "json",
                data: JSON.stringify(l_container)
            })
                .then(function success(response) {
                    $scope.reloadrecord(container.index);
                    //$scope.loadData(); // refresh whole list if needed

                }, function error(error) {
                    if (error.status == 401)
                        alert("Access Denied!!!")
                    else
                        alert("Unknown Error");
                    console.error('error', error);
                });
        }
        else {
            // create a container without "id" field
            delete l_container['id'];
            xjson = JSON.stringify(l_container);

            //INSERT
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_calevent",
                withCredentials: true,
                method: 'POST',
                datatype: "json",
                data: JSON.stringify(l_container)
            })
                .then(function success(response) {
                    $scope.loadData();
                }, function error(error) {
                    if (error.status == 401)
                        alert("Access Denied!!!")
                    else
                        alert("Unknown Error!");
                    console.error('error', error);
                });
        }
    }

    $scope.pcm_gcaleventedit = function () {
       
            l_gcalevents = $rootScope.getSelectedRows($rootScope.gcaleventlistid, $scope.pcm_gcalevents);
            if (l_gcalevents.length > 10) {
                console.error('error', 'invalid number of records');
                return;
            }

        angular.forEach(l_gcalevents, function (item, index) {
            window.open(item.htmlLink);
        }, function () { /* cancel */ });
    };

    $scope.pcm_caleventedit = function (createnew) {
        if (createnew) {
            var pcm_calevent = { id: null, type: null, description: null, starttime: new Date(), durationtime: new Date()};
            $scope.pcm_caleventsave(pcm_calevent); // temporary bastl
            return; // temporary bastl
        } 
        else {
            l_calevents = $rootScope.getSelectedRows($rootScope.caleventlistid, $scope.pcm_calevents);
            if (l_calevents.length != 1) {
                console.error('error', 'invalid number of records');
                return;
            }
            pcm_calevent = l_calevents[0];
        }

        var modalInstance = $uibModal.open({
            templateUrl: 'views/partials/pcm_caleventedit.html',
            controller: 'pcm_caleventeditcontroller',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                container: function () {
                    return pcm_calevent;
                }
            }
        });

        modalInstance.result.then(function (container) {
            /* ok */
            $scope.pcm_caleventsave(container);

        }, function () { /* cancel */ });
    };

    $scope.i_pcm_caleventmerge = function (caleventindex, gcaleventindex, forceupdate) {

        $scope.pcm_calevents[caleventindex].gcaljson = $scope.pcm_gcalevents[gcaleventindex].gcaljson;
        $scope.pcm_calevents[caleventindex].gcalid = $scope.pcm_gcalevents[gcaleventindex].id;
        $scope.pcm_calevents[caleventindex].gcalsummary = $scope.pcm_gcalevents[gcaleventindex].summary;

        if (forceupdate || !$scope.pcm_calevents[caleventindex].starttime) {
            $scope.pcm_calevents[caleventindex].starttime = $scope.pcm_gcalevents[gcaleventindex].starttime;
        }
        if (forceupdate || !$scope.pcm_calevents[caleventindex].totime) {
            $scope.pcm_calevents[caleventindex].totime = $scope.pcm_gcalevents[gcaleventindex].totime;
        }
        if (forceupdate || !$scope.pcm_calevents[caleventindex].durationtime) {
            $scope.pcm_calevents[caleventindex].durationtime = $scope.pcm_gcalevents[gcaleventindex].durationtime;
        }
        if (forceupdate || !$scope.pcm_calevents[caleventindex].title) {
            $scope.pcm_calevents[caleventindex].title = $scope.pcm_gcalevents[gcaleventindex].summary;
        }

        $scope.pcm_caleventsave($scope.pcm_calevents[caleventindex]);
    }


    $scope.pcm_caleventmerge = function (forceupdate) {
        l_calevents = $rootScope.getSelectedRows($rootScope.caleventlistid, $scope.pcm_calevents);
        if (l_calevents.length != 1) {
            alert('Select exactly one Calendar event');
            console.error('error', 'invalid number of records');
            return;
        }
        caleventindex = l_calevents[0].index;

        l_gcalevents = $rootScope.getSelectedRows($rootScope.gcaleventlistid, $scope.pcm_gcalevents);
        if (l_gcalevents.length != 1) {
            console.error('error', 'invalid number of records');
            alert('Select exactly one Google event');
            return;
        }
        gcaleventindex = l_gcalevents[0].index;

        $scope.i_pcm_gcaleventmerge(caleventindex, gcaleventindex, forceupdate);
    }

    $scope.pcm_caleventgenerate = function () {
        l_items = $rootScope.getSelectedRows($rootScope.gcaleventlistid, $scope.pcm_gcalevents);
        if (l_items.length == 0) {
            console.error('error', 'invalid number of records');
            return;
        }

        if (!confirm("Generate " + l_items.length + " records?"))
            return;

        angular.forEach(l_items, function (item, index) {
            var l_container = { type: null, description: null, starttime: new Date(), durationtime: new Date()};

            // create a container without "id" field
            xjson = JSON.stringify(l_container);

            //INSERT
            $http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_calevent",
                withCredentials: true,
                method: 'POST',
                datatype: "json",
                data: JSON.stringify(l_container)
            })
                .then(function success(response) {
                    var caleventindex = $scope.pcm_calevents.length;
                    $scope.pcm_calevents[caleventindex] = response.data;
                    $scope.pcm_calevents[caleventindex].index = caleventindex;
                    $scope.i_pcm_caleventmerge(caleventindex, item.index, true);
                }, function error(error) {
                    if (error.status == 401)
                        alert("Access Denied!!!")
                    else
                        alert("Unknown Error!");
                    console.error('error', error);
                });

        });

    }

    function i2_pcm_connectcaleventstoorder(pCalevents, pOrder, pStartindex) {
        if (pStartindex >= pCalevents.length) {
            // all ordersessions created -> recalculate 
            angular.forEach($scope.pcm_calevents, function (calevent, index) {
                if (calevent.orderssions || calevent.ordersessions.length > 0)
                    angular.forEach(calevent.ordersessions, function (ordersession, index2) {
                        if (ordersession.orderid == pOrder.id)
                            $scope.getordersessions(calevent.index);
                    });
            });
            angular.forEach(pCalevents, function (calevent, index) {
                $scope.getordersessions(calevent.index);
            });
        }
        else {  
            // create another 
            l_exists = false;
            if (pCalevents[pStartindex].ordersessions && pCalevents[pStartindex].ordersessions.length > 0) {
                angular.forEach(pCalevents[pStartindex].ordersessions, function (ordersession, index2) {
                    if (ordersession.orderid == pOrder.id)
                        l_exists = true;
                });
            }
            if (!l_exists) {

                l_skip = false;
                if (pCalevents[pStartindex].ordersessions && pCalevents[pStartindex].ordersessions.length > 0) {                   // the session is connected to another order - confirm creation 
                    if (!confirm("Event nr. " + pCalevents[pStartindex].id + " is already connected to another order. Connect to more events?"))
                        l_skip = true;
                }
                if (!l_skip) {

                    // create a new ordersession and refresh the calevent 
                    var pcm_ordersession = { orderid: pOrder.id, invoicetext: null, rate: null, price: null, caleventid: pCalevents[pStartindex].id };

                    // create a container without "id" field
                    xjson = JSON.stringify(pcm_ordersession);
                    //                    console.log("pcm_ordersession", pcm_ordersession);

                    //INSERT
                    var promise = $http({
                        headers: { "Content-Type": "application/json" },
                        url: $rootScope.ApiAddress + "api/pcm_ordersession",
                        withCredentials: true,
                        method: 'POST',
                        datatype: "json",
                        data: xjson
                    })
                        .then(function success(response) {
                            i2_pcm_connectcaleventstoorder(pCalevents, pOrder, pStartindex + 1);
                        }, function error(error) {
                            if (error.status == 401)
                                alert("Access Denied!!!")
                            else
                                alert("Unknown Error!");
                            console.error('error', error);
                            i2_pcm_connectcaleventstoorder(pCalevents, pOrder, pStartindex+1)
                        });

                }
            }
        }
    }

    function i_pcm_connectcaleventstoorder(pOrders) {
        l_calevents = $rootScope.getSelectedRows($rootScope.caleventlistid, $scope.pcm_calevents);
        if (!l_calevents || l_calevents.length == 0)
            return; 

        if (!confirm("Connect " + l_calevents.length + " events to order of " + pOrders[0].customer.name + "?"))
            return;

        i2_pcm_connectcaleventstoorder(l_calevents, pOrders[0], 0);

     

    }

    $scope.pcm_connectcaleventstoorder = function () {
        if ($scope.$parent.controllerName == 'pcm_ordercontroller') {
            l_orders = $rootScope.getSelectedRows($rootScope.orderlistid, $scope.$parent.pcm_orders);
            if (l_orders.length != 1) {
                alert('Select exactly one Order');
                console.error('error', 'invalid number of records');
                return;
            }
            i_pcm_connectcaleventstoorder(l_orders);
        }
        else
            if ($scope.$parent.controllerName == 'pcm_ordereditcontroller') {
                l_orders = [{
                    id: $scope.$parent.dataCopy.id,
                    customer: {
                        name: $scope.$parent.dataCopy.customer.name
                    }
                }];
                i_pcm_connectcaleventstoorder(l_orders);

            } else { /* call customer lookup */
                $rootScope.entitySelect('pcm_order', false).then(function (l_orders) {
                    i_pcm_connectcaleventstoorders(l_orders);
                }, function (error) {
                    if (error == "cancel") {
                        //   $rootScope.showalert("error", "Connect Calevents to Orders", "No order selected", "OK");
                    }
                    else
                        $rootScope.showerror($scope, 'pcm_connectcaleventstoorder', error);
                });
            }
    }


    function i_pcm_connectcaleventstocustomer(pCustomers) {
        l_calevents = $rootScope.getSelectedRows($rootScope.caleventlistid, $scope.pcm_calevents);

        if (!confirm("Connect " + l_calevents.length + " events to client " + pCustomers[0].name + "?"))
            return;

        angular.forEach(l_calevents, function (calevent, index) {
            if (calevent.customerid) {
                if (calevent.customerid == pCustomers[0].id)
                    return;
                if (!confirm("Event nr. " + calevent.id + " is already connected to client " + calevent.customer.name + ". Reconnect to " + pCustomers[0].name + "?"))
                    return;
            }

            calevent.customerid = pCustomers[0].id;
            $scope.pcm_caleventsave(calevent);
        });

    }

    $scope.pcm_connectcaleventstocustomer = function () {
        if ($scope.$parent.controllerName == 'pcm_customercontroller') {
            l_customers = $rootScope.getSelectedRows($rootScope.customerlistid, $scope.$parent.pcm_customers);
            if (l_customers.length != 1) {
                alert('Select exactly one Client');
                console.error('error', 'invalid number of records');
                return;
            }
            i_pcm_connectcaleventstocustomer(l_customers);
        }
        else
            if ($scope.$parent.controllerName == 'pcm_customereditcontroller') {
                l_customers = [{
                        id: $scope.$parent.dataCopy.id,
                        name: $scope.$parent.dataCopy.name                    
                }];
                i_pcm_connectcaleventstocustomer(l_customers);

            } else { /* call customer lookup */
                    $rootScope.entitySelect('pcm_customer', false).then(function (l_customers) {
                        i_pcm_connectcaleventstocustomer(l_customers);
                    }, function (error) {
                            if (error == "cancel") {
                             //   $rootScope.showalert("error", "Connect Calevents to Customer", "No customer selected", "OK");
                            }
                            else
                                $rootScope.showerror($scope, 'pcm_connectcaleventstocustomer', error);
                    });
            }        
    }



    $scope.i_delete = function (pItem) {
        // check dependency and delete sub-objects first
        // check the first sub-condition
        var promise1 = $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/pcm_ordersession/caleventid/" + pItem.id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                lOs = response.data;
                var promises = [];
                if (lOs && lOs.length > 0) { // check and delete ordersessions first

                    if (confirm("Event nr. " + pItem.id + " is connected to any order(s). Delete anyway?")) {
                        angular.forEach(lOs, function (ordersession, osindex) {

                            var promise = $http({
                                headers: { "Content-Type": "application/json" },
                                url: $rootScope.ApiAddress + "api/pcm_ordersession/" + ordersession.id,
                                withCredentials: true,
                                method: 'DELETE'
                            })
                                .then(function success(response) {
                                    return response.$promise;
                                }, function error(error) {
                                    if (error.status == 401)
                                        alert("Access Denied!!!");
                                    else
                                        alert("Unknown Error!");
                                    console.error('error', error);
                                });

                            promises.push(promise);
                        });
                    }
                }
                return $q.all(promises);
              
            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    alert("Unknown Error!");
                console.error('error', error);
            });

        // if all the conditions are OK
        var promise3 =
        promise1.then(function (promiseArray) {
            var promise2=$http({
                headers: { "Content-Type": "application/json" },
                url: $rootScope.ApiAddress + "api/pcm_calevent/" + pItem.id,
                withCredentials: true,
                method: 'DELETE'
            })
                .then(function success(response) {
                    return response.$promise;
                }, function error(error) {
                    if (error.status == 401)
                        alert("Access Denied!!!");
                    else
                        alert("Unknown Error!");
                    console.error('error', error);
                });
            return $q.all([promise2]);
        });
        return $q.all([promise3]);
    }

    $scope.pcm_caleventdelete = function () {
        l_items = $rootScope.getSelectedRows($rootScope.caleventlistid, $scope.pcm_calevents);
        if (l_items.length == 0) {
            console.error('error', 'invalid number of records');
            return;
        }

        if (!confirm("Delete " + l_items.length + " records?"))
            return;

        $rootScope.resetSelection($rootScope.caleventlistid);

        var promise1 = function() {
            var promises = [];
            angular.forEach(l_items, function (item, index) {
                var promise2 = $scope.i_delete(item)
                    .then(function success(response) {
                        return response.$promise;
                    }); 
                promises.push(promise2);
            });
            return $q.all(promises);
        };

        promise1().then(function (promiseArray) {
            $scope.loadData();
        });        
    };


    $scope.pcm_caleventdata = function () {
        $scope.selectedpcm_calevent = null;

        l_items = $rootScope.getSelectedRows($rootScope.caleventlistid, $scope.pcm_calevents);
        if (l_items.length != 1) {
            return;
        }

        $scope.selectedpcm_calevent = l_items[0];
//        if ($scope.selectedpcm_calevent.gcalhtmllink)
//            $scope.detailFrame = $sce.trustAsResourceUrl($scope.selectedpcm_calevent.gcalhtmllink);              
    };

    $scope.pcm_gcaleventdata = function () {
        $scope.selectedpcm_gcalevent = null;

        l_items = $rootScope.getSelectedRows($rootScope.gcaleventlistid, $scope.pcm_gcalevents);
        if (l_items.length != 1) {
            return;
        }

        $scope.selectedpcm_gcalevent = l_items[0];
    };

    $scope.useremail = "";

    $scope.displaycustomersoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to seleted customers" },
        { Value: "SELECTED", Text: "Connected to seleted customers" },
        { Value: "NULL", Text: "Not connected to customers" }
    ];

    $scope.displayordersoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "SELECTED+", Text: "Not conntected or connected to seleted orders" },
        { Value: "SELECTED", Text: "Connected to seleted orders" },
        { Value: "NULL", Text: "Not connected to orders" }
    ];

    $scope.displaycaleventsoptions = [
        { Value: "ALL", Text: "All" },
        { Value: "CONNECTED", Text: "Connected to any event" },
        { Value: "SELECTED+", Text: "Not conntected or connected to seleted events" },
        { Value: "SELECTED", Text: "Connected to seleted events" },
        { Value: "NULL", Text: "Not connected any event" }
    ];

    if (!$scope.$parent.controllerName) {  // top level view
        $scope.displaycustomers = "ALL";
        $scope.displayorders = "ALL";
        $scope.displaycalevents = "ALL";
    }
    else if ($scope.$parent.controllerName == "pcm_ordercontroller") {
//        $scope.hideItem_FilterCustomers = true;
        $scope.hideItem_ConnectCustomers = true;
        $scope.hideItem_ListGCalEvent = true;
        $scope.hideItem_ButtonMergecalvents = true;
        $scope.displayorders = "SELECTED+";
        $scope.displaycustomers = "SELECTED+";
    }
    else if ($scope.$parent.controllerName == "pcm_ordereditcontroller") {
//        $scope.hideItem_FilterCustomers = true;
        $scope.hideItem_ConnectCustomers = true;
        $scope.hideItem_ListGCalEvent = true;
        $scope.hideItem_ButtonMergecalvents = true;
        $scope.displayorders = "SELECTED";
        $scope.displaycustomers = "SELECTED+";
    }
    else if ($scope.$parent.controllerName == "pcm_customereditcontroller") {
        $scope.hideItem_FilterOrders = true;
        $scope.displaycustomers = "SELECTED";
        $scope.displaycalevents = "ALL";
    }
    else if ($scope.$parent.controllerName == "pcm_customercontroller") {
        $scope.hideItem_FilterOrders = true;
        $scope.displaycustomers = "SELECTED+";
        $scope.displaycalevents = "ALL";
    }
    else {  // used on any other screen
        $scope.displaycustomers = "ALL";
        $scope.displayorders = "ALL";
        $scope.displaycalevents = "ALL";
    }

    $scope.selectedpcm_calevent = null;
    $scope.selectedpcm_gcalevent = null;


    $scope.loadData();
    $rootScope.kerReftabInit();



});

app.controller('pcm_caleventeditcontroller', function ($scope, $uibModalInstance, container, $uibModal, uibDateParser) {
    $scope.controllerName = 'pcm_caleventeditcontroller';

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


    $scope.pcm_calevent = container;
    $scope.dataCopy = angular.copy($scope.pcm_calevent);
    $scope.popup1 = { opened: false }; // initialize datapicker for fromdate

    $scope.ok = function () {
        angular.forEach($scope.dataCopy, function (value, key) {
            $scope.pcm_calevent[key] = value;
        });

        $uibModalInstance.close($scope.pcm_calevent);
    };

    $scope.cancel = function () {
        angular.forEach($scope.pcm_calevent, function (value, key) {
            $scope.dataCopy[key] = value;
        });

        $uibModalInstance.dismiss('cancel');
    };

    $scope.open1 = function () { // open datapicker for fromdate
        $scope.popup1.opened = true;
    };
});

app.controller('pcm_gcaleventeditcontroller', function ($scope, $uibModalInstance, container, $uibModal) {

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


    $scope.controllerName = 'pcm_gcaleventeditcontroller';

    $scope.pcm_gcalevent = container;

    $scope.ok = function () {
        $uibModalInstance.close($scope.pcm_gcalevent);
    };

    $scope.cancel = function () {
        $scope.myForm.$rollbackViewValue();
        $uibModalInstance.dismiss('cancel');
    };
});
