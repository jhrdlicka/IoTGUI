/**
 * pcm_calevent list
 */
app.controller('pcm_caleventcontroller', function ($scope, $http, $uibModal) {

    function initClient() {
        var CLIENT_ID = '889423769056-rgfo7ep7d8ofgn6t6veq4q22erk7svg0.apps.googleusercontent.com';
        var API_KEY = 'AIzaSyBYRf_VsyEn8fgkYzHvNEncicBk5bg9heQ';
        // Array of API discovery doc URLs for APIs used by the quickstart
        var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

        // Authorization scopes required by the API; multiple scopes can be
        // included, separated by spaces.
        var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

        var authorizeButton = document.getElementById('authorize_button');
        var signoutButton = document.getElementById('signout_button');

        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(function () {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
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
            $scope.runimportGCalEvents();
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
    }

    $scope.runimportGCalEvents = function () {
        gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime'
        }).then(function (response) {
            $scope.pcm_gcalevents = response.result.items;
            angular.forEach($scope.pcm_gcalevents, function (item, index) {
//                var l_teststring = item.start.dateTime.toISOString();
                $scope.pcm_gcalevents[index].startdate = new Date(item.start.dateTime); //"2020-11-13T21:42:18.77"   "2020-11-27T08:00:00+01:00"
                $scope.pcm_gcalevents[index].starttime = new Date(item.start.dateTime);
                $scope.pcm_gcalevents[index].totime = new Date(item.end.dateTime);
                $scope.pcm_gcalevents[index].durationtime = new Date("2020-01-01T00:00:00+01:00");
//                $scope.pcm_gcalevents[index].durationtime.setMinutes($scope.pcm_gcalevents[index].durationtime.getMinutes() + $scope.pcm_gcalevents[index].totime.getMinutes() - $scope.pcm_gcalevents[index].starttime.getMinutes());     
                $scope.pcm_gcalevents[index].gcaljson = JSON.stringify(item);     
                $scope.pcm_gcalevents[index].participantlist = [];
                if (!item.organizer) {
                    $scope.pcm_gcalevents[index].participants = "";
                    item.organizer = { "email": "noemail" };
                    var i = 0;                    
                }
                else {
                    var i = 1;
                    if (!item.organizer.displayName) {
                        $scope.pcm_gcalevents[index].participantlist[0] = '<' + item.organizer.email + '>';
                        $scope.pcm_gcalevents[index].participants = '\n <' + item.organizer.email + '>';
                    }
                    else {
                        $scope.pcm_gcalevents[index].participantlist[0] = '"' + item.organizer.displayName + '" <' + item.organizer.email + '>';
                        $scope.pcm_gcalevents[index].participants = '\n "' + item.organizer.displayName + '" <' + item.organizer.email + '>';
                    }
                }
                angular.forEach(item.attendees, function (participant, index2) {
                    if (participant.email != item.organizer.email) {
                        if (!participant.displayName) {
                            $scope.pcm_gcalevents[index].participantlist[i] = '<' + participant.email + '>';
                            $scope.pcm_gcalevents[index].participants = $scope.pcm_gcalevents[index].participants + '\n <' + participant.email + '>';
                        }
                        else {
                            $scope.pcm_gcalevents[index].participantlist[i] = '"' + participant.displayName + '" <' + participant.email + '>';
                            $scope.pcm_gcalevents[index].participants = $scope.pcm_gcalevents[index].participants + '\n "' + participant.displayName + '" <' + participant.email + '>';
                        };
                        i = i + 1;
                    }
                });                
                $scope.pcm_gcalevents[index].participants = $scope.pcm_gcalevents[index].participants.substring(2);

                //$scope.pcm_gcalevents[index].startdate = new Date(item.start);
                //console.error('Event:', item.summary + ' (' + item.start.date + ')');
            });

        }, function error(error) {
            if (error.status == 401)
                alert("Access Denied!!!");
            else
                alert("Unknown Error!");
            console.error('error', error);
        });

    }

    $scope.getcustomer = function (caleventid) {
        if (!$scope.pcm_calevents[caleventid].customerid)
            $scope.pcm_calevents[caleventid].customer = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $scope.ApiAddress + "api/pcm_customer/"+$scope.pcm_calevents[caleventid].customerid,
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
                     $scope.pcm_calevents[index].startdate = new Date(item.start);
                     $scope.pcm_calevents[index].starttime = new Date(item.start);                   
                     $scope.pcm_calevents[index].totime = new Date(item.start);
                     $scope.pcm_calevents[index].totime.setMinutes($scope.pcm_calevents[index].totime.getMinutes() + item.duration.value.totalMinutes);
                     $scope.pcm_calevents[index].durationtime = new Date($scope.pcm_calevents[index].totime - $scope.pcm_calevents[index].starttime);                     
                     $scope.getcustomer(index);

                     $scope.pcm_calevents[index].totime = $scope.pcm_calevents[index].totime;  //  null command                   

                 });

             }, function error(error) {
                     if (error.status == 401)
                         alert("Access Denied!!!");
                     else
                         alert("Unknown Error!");
                 console.error('error', error);
             });
//        if (!$scope.pcm_gcalevents) 
            $scope.loadGData();
    };

    /**
     * Print the summary and start datetime/date of the next ten events in
     * the authorized user's calendar. If no events are found an
     * appropriate message is printed.
     */
    $scope.importGCalEvents = function () {

        gapi.load('client:auth2', initClient);

    };

    $scope.loadGData = function () {
        $scope.pcm_gcalevents = null;
        $scope.selectedpcm_gcalevent = null;

        $scope.importGCalEvents();
        /*
        $http({
            headers: { "Content-Type": "application/json" },
            url: $scope.ApiAddress + "api/pcm_gcalevent",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                $scope.pcm_gcalevents = response.data;
                //console.log("pcm_gcalevents", $scope.pcm_gcalevents);
                angular.forEach($scope.pcm_gcalevents, function (item, index) {
                    item.start = new Date();                    // set to "now" for time being :)
                    item.duration = { "totalMinutes": 30 };       // set to 30 min for time being :)
                    $scope.pcm_gcalevents[index].startdate = new Date(item.start);
                    $scope.pcm_gcalevents[index].starttime = new Date(item.start);
                    $scope.pcm_gcalevents[index].totime = new Date(item.start);
                    $scope.pcm_gcalevents[index].totime.setMinutes($scope.pcm_gcalevents[index].totime.getMinutes() + item.duration.value.totalMinutes);
                    $scope.pcm_gcalevents[index].durationtime = new Date($scope.pcm_gcalevents[index].totime - $scope.pcm_calevents[index].starttime);
                    $scope.getgcustomer(index);

                    $scope.pcm_gcalevents[index].totime = $scope.pcm_gcalevents[index].totime;  //  null command              

                });

            }, function error(error) {
                if (error.status == 401)
                    alert("Access Denied!!!");
                else
                    alert("Unknown Error!");
                console.error('error', error);
            });

*/

    };


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



    $scope.pcm_caleventedit = function (pcm_calevent) {
        if (!pcm_calevent)
            pcm_calevent = { id: null, type: null, description: null }; 

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

            container.type = parseInt(container.type);
            var xcont = JSON.stringify(container);

            if (container.id) {
                //UPDATE
                $http({
                    headers: { "Content-Type": "application/json" },
                    url: $scope.ApiAddress + "api/pcm_calevent/" + container.id,
                    withCredentials: true,
                    method: 'PUT',
                    datatype: "json",
                    data: JSON.stringify(container)
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
                var l_container = angular.copy(container); //Object.assign({}, container);
                delete l_container['id'];
              
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

        }, function () { /* cancel */ });
    };

    $scope.pcm_caleventdelete = function (pcm_calevent) {
        if (!confirm("Delete event with '" + pcm_calevent.customer.firstname + pcm_calevent.customer.surname + "'. Are you sure?"))
            return;

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
    };

    $scope.selectedpcm_calevent = null;

    $scope.pcm_caleventdata = function (pcm_calevent) {
        $scope.selectedpcm_calevent = null;
        if (!pcm_calevent)
            return;

        $scope.selectedpcm_calevent = pcm_calevent;
    };

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