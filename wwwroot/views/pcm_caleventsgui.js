/**
 * pcm_calevent list
 */
app.controller('pcm_caleventcontroller', function ($scope, $http, $uibModal, $cookies,  $window) {

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
            apiKey: $scope.API_KEY,
            clientId: $scope.CLIENT_ID,
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
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
        }, function (error) {
            appendPre(JSON.stringify(error, null, 2));
        });
    }

    function updateSigninStatus(isSignedIn) {
        var authorizeButton = document.getElementById('authorize_button');
        var signoutButton = document.getElementById('signout_button');

        if (isSignedIn) {
            authorizeButton.style.display = 'none';
            signoutButton.style.display = 'block';

            $scope.runimportCalEvents();
        } else {
            authorizeButton.style.display = 'block';
            signoutButton.style.display = 'none';
        }
    }

    function handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
    }
    function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();

        $window.signedIn = false;
        $cookies.remove(".AspNetCore.Cookies");
        $scope.isAuthorize = false;

        const url = "http://accounts.google.com/Logout?redirectUrl=" + encodeURIComponent(window.location.href);
        window.open(url);

        $scope.isAuthorize = false;
    }


    $scope.runimportGCalEvents = function () {

        $scope.pcm_gcalevents = null;
        $scope.selectedpcm_gcalevent = null;

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
                //                var l_teststring = item.start.dateTime.toISOString();
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

            resetSelection($scope.gcaleventlist);

            $scope.$apply()

        }, function error(error) {
            if (error.status == 401)
                alert("Access Denied!!!");
            else
                alert("Unknown Error!");
            console.error('error', error);
        });

    }

    $scope.getcustomer = function (caleventid) {
        if (!$scope.pcm_calevents[caleventid].customerid) {
            $scope.pcm_calevents[caleventid].customer = null;
            return;
        }
        

        $http({
            headers: { "Content-Type": "application/json" },
            url: $scope.ApiAddress + "api/pcm_customer/" + $scope.pcm_calevents[caleventid].customerid,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_calevents[caleventid].customer = response.data;

            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    alert("Unknown Error!");
                console.error('error', error);
                $scope.pcm_calevents[caleventid].customer = null;
            });
    };

    $scope.loadData = function () {

        $http({
            method: 'GET',
            url: '/api/Configuration/ConfigurationData'
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
            $scope.CLIENT_ID = response.data.CLIENT_ID;
            $scope.API_KEY = response.data.API_KEY;

            gapi.load('client:auth2', initClient);

        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });

    }

    $scope.runimportCalEvents = function () {

        $scope.pcm_calevents = null;
        $scope.selectedpcm_calevent = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $scope.ApiAddress + "api/pcm_calevent",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_calevents = response.data;
                //console.log("pcm_calevents", $scope.pcm_calevents);
                angular.forEach($scope.pcm_calevents, function (item, index) {
                    if (item.start)
                        $scope.pcm_calevents[index].start = item.start+"Z";
                    $scope.pcm_calevents[index].index = index;
                    $scope.pcm_calevents[index].starttime = new Date(item.start);
                    $scope.pcm_calevents[index].totime = new Date(item.start);
                    $scope.pcm_calevents[index].totime.setSeconds($scope.pcm_calevents[index].totime.getSeconds() + item.duration);
                    $scope.pcm_calevents[index].durationtime = new Date();
                    $scope.pcm_calevents[index].durationtime = $scope.timeDifference($scope.pcm_calevents[index].starttime, $scope.pcm_calevents[index].totime);
                    if (!$scope.pcm_calevents[index].gcalid)
                        $scope.pcm_calevents[index].gcalidflag = false;
                    else
                        $scope.pcm_calevents[index].gcalidflag = true;
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



                });
                resetSelection($scope.caleventlist);

                $scope.runimportGCalEvents();


            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    alert("Unknown Error!");
                console.error('error', error);
            });

        

    };

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
                url: $scope.ApiAddress + "api/pcm_calevent/" + l_container.id,
                withCredentials: true,
                method: 'PUT',
                datatype: "json",
                data: JSON.stringify(l_container)
            })
                .then(function success(response) {
                    $scope.loadData();
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
                url: $scope.ApiAddress + "api/pcm_calevent",
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

    $scope.pcm_caleventedit = function (createnew) {
        if (createnew) {
            var pcm_calevent = { id: null, type: null, description: null, starttime: new Date(), durationtime: new Date(), xordered: false};
            $scope.pcm_caleventsave(pcm_calevent); // temporary bastl
            return; // temporary bastl
        } 
        else {
            l_calevents = getSelectedRows($scope.caleventlist);
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

    $scope.pcm_caleventmerge = function (forceupdate) {
        l_calevents = getSelectedRows($scope.caleventlist);
        if (l_calevents.length != 1) {
            console.error('error', 'invalid number of records');
            return;
        }
        caleventindex = l_calevents[0].index;

        l_gcalevents = getSelectedRows($scope.gcaleventlist);
        if (l_gcalevents.length != 1) {
            console.error('error', 'invalid number of records');
            alert('Select exactly one Google event');
            return;
        }
        gcaleventindex = l_gcalevents[0].index;

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

    $scope.pcm_caleventdelete = function () {
        l_calevents = getSelectedRows($scope.caleventlist);
        if (l_calevents.length == 0) {
            console.error('error', 'invalid number of records');
            return;
        }

        if (!confirm("Delete " + l_calevents.length + " records?"))
            return;


        angular.forEach(l_calevents, function (pcm_calevent, index) {

            $http({
                headers: { "Content-Type": "application/json" },
                url: $scope.ApiAddress + "api/pcm_calevent/" + pcm_calevent.id,
                withCredentials: true,
                method: 'DELETE'
            })
                .then(function success(response) {
                    $scope.loadData();
                }, function error(error) {
                    if (error.status == 401)
                        alert("Access Denied!!!");
                    else
                        alert("Unknown Error!");
                    console.error('error', error);
                });
        });
    };

    $scope.pcm_caleventdata = function () {
        $scope.selectedpcm_calevent = null;

        l_calevents = getSelectedRows($scope.caleventlist);
        if (l_calevents.length != 1) {
            return;
        }

        $scope.selectedpcm_calevent = l_calevents[0];
    };

    $scope.pcm_gcaleventdata = function () {
        $scope.selectedpcm_gcalevent = null;

        l_gcalevents = getSelectedRows($scope.gcaleventlist);
        if (l_gcalevents.length != 1) {
            return;
        }

        $scope.selectedpcm_gcalevent = l_gcalevents[0];
    };


    $scope.selectRow = function (list, event, rowIndex) {
        if (event.ctrlKey) {
            changeSelectionStatus(list, rowIndex);
        } else if (event.shiftKey) {
            selectWithShift(list, rowIndex);
        } else {
            $scope.selectedRowsIndexes[list] = [rowIndex];
        }
        /*
        console.log($scope.selectedRowsIndexes[list]);
        console.log(getSelectedRows(list));
        console.log(getFirstSelectedRow(list));
        */
        $scope.pcm_caleventdata();
        $scope.pcm_gcaleventdata();
    };

    function selectWithShift(list, rowIndex) {
        var lastSelectedRowIndexInSelectedRowsList = $scope.selectedRowsIndexes[list].length - 1;
        var lastSelectedRowIndex = $scope.selectedRowsIndexes[list][lastSelectedRowIndexInSelectedRowsList];
        var selectFromIndex = Math.min(rowIndex, lastSelectedRowIndex);
        var selectToIndex = Math.max(rowIndex, lastSelectedRowIndex);
        selectRows(list, selectFromIndex, selectToIndex);
    }

    function getSelectedRows(list) {
        var selectedRows = [];
        angular.forEach($scope.selectedRowsIndexes[list], function (rowIndex) {
            if (list == $scope.caleventlist)
                selectedRows.push($scope.pcm_calevents[rowIndex]);
            if (list == $scope.gcaleventlist)
                selectedRows.push($scope.pcm_gcalevents[rowIndex]);
        });
        return selectedRows;
    }

    function getFirstSelectedRow(list) {
        var firstSelectedRowIndex = $scope.selectedRowsIndexes[0];
        if (list == $scope.caleventlist) 
            return $scope.pcm_calevents[firstSelectedRowIndex];
        if (list == $scope.gcaleventlist) 
            return $scope.pcm_gcalevents[firstSelectedRowIndex];
    }

    function selectRows(list, selectFromIndex, selectToIndex) {
        for (var rowToSelect = selectFromIndex; rowToSelect <= selectToIndex; rowToSelect++) {
            select(list, rowToSelect);
        }
    }

    function changeSelectionStatus(list, rowIndex) {
        if ($scope.isRowSelected(list, rowIndex)) {
            unselect(list, rowIndex);
        } else {
            select(list, rowIndex);
        }
    }

    function select(list, rowIndex) {
        if (!$scope.isRowSelected(list, rowIndex)) {
            $scope.selectedRowsIndexes[list].push(rowIndex)
        }
    }

    function unselect(list, rowIndex) {
        var rowIndexInSelectedRowsList = $scope.selectedRowsIndexes[list].indexOf(rowIndex);
        var unselectOnlyOneRow = 1;
        $scope.selectedRowsIndexes[list].splice(rowIndexInSelectedRowsList, unselectOnlyOneRow);
    }

    function resetSelection(list) {
        $scope.selectedRowsIndexes[list] = [];
    }

    $scope.isRowSelected = function (list, rowIndex) {
        return $scope.selectedRowsIndexes[list].indexOf(rowIndex) > -1;
    };

    /*
    $scope.$on('ngTableAfterReloadData', function () {
        resetSelection($scope.caleventlist);
        resetSelection($scope.gcaleventlist);
    });
    */

    $scope.caleventlist = 1;
    $scope.gcaleventlist = 2;
    $scope.selectedRowsIndexes = [];
    $scope.selectedRowsIndexes[$scope.caleventlist] = [];
    $scope.selectedRowsIndexes[$scope.gcaleventlist] = [];

    $scope.useremail = "";

    $scope.CLIENT_ID = "";
    $scope.API_KEY = "";

    $scope.selectedpcm_calevent = null;
    $scope.selectedpcm_gcalevent = null;

    $http({
        method: 'GET',
        url: '/api/Configuration/ConfigurationData'
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        $scope.ApiAddress = response.data.ApiAddress;
        console.log("ApiAddress", $scope.ApiAddress);

        $scope.loadData();

    }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

});

app.controller('pcm_caleventeditcontroller', function ($scope, $uibModalInstance, container, $uibModal) {

    $scope.currencylist = [
        { Value: null, Text: "--Currency--" },
        { Value: "CZK", Text: "CZK" },
        { Value: "EUR", Text: "EUR" },
        { Value: "USD", Text: "USD" }
    ];

    $scope.pcm_calevent = container;
    //console.log($scope.pcm_calevent);

    $scope.ok = function () {
        $uibModalInstance.close($scope.pcm_customer);
    };

    $scope.cancel = function () {
        $scope.myForm.$rollbackViewValue();
        $uibModalInstance.dismiss('cancel');
    };
});