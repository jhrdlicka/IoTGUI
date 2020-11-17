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
        var loadgdataButton = document.getElementById('loadgdata_button');

        gapi.client.init({
            apiKey: $scope.API_KEY,
            clientId: $scope.CLIENT_ID,
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
        var loadgdataButton = document.getElementById('loadgdata_button');

        if (isSignedIn) {
            authorizeButton.style.display = 'none';
            signoutButton.style.display = 'block';
            loadgdataButton.style.display = 'block';
            $scope.runimportGCalEvents();
        } else {
            authorizeButton.style.display = 'block';
            signoutButton.style.display = 'none';
            loadgdataButton.style.display = 'none';
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
        const googleAuth = gapi.auth2.getAuthInstance()

        var useremail = "";

        if (googleAuth.isSignedIn.get()) {
            var profile = googleAuth.currentUser.get().getBasicProfile();
//            console.log('ID: ' + profile.getId());
//            console.log('Full Name: ' + profile.getName());
//            console.log('Given Name: ' + profile.getGivenName());
//            console.log('Family Name: ' + profile.getFamilyName());
//            console.log('Image URL: ' + profile.getImageUrl());
//            console.log('Email: ' + profile.getEmail());
            useremail = profile.getEmail();
        }        

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
                $scope.pcm_gcalevents[index].id = index; 
                $scope.pcm_gcalevents[index].startdate = new Date(item.start.dateTime); //"2020-11-13T21:42:18.77"   "2020-11-27T08:00:00+01:00"
                $scope.pcm_gcalevents[index].starttime = new Date(item.start.dateTime);
                $scope.pcm_gcalevents[index].totime = new Date(item.end.dateTime);
//                $scope.pcm_gcalevents[index].durationtime = new Date("2020-01-01T00:00:00+01:00");
                $scope.pcm_gcalevents[index].durationtime = new Date();
                $scope.pcm_gcalevents[index].durationtime = $scope.timeDifference($scope.pcm_gcalevents[index].starttime, $scope.pcm_gcalevents[index].totime);                     
                $scope.pcm_gcalevents[index].gcaljson = JSON.stringify(item);     
                $scope.pcm_gcalevents[index].participantlist = [];
                var i = 0;
                $scope.pcm_gcalevents[index].participants = "";

                if (!item.organizer) {
                    item.organizer = { "email": "noemail" };
                }
                else {
                    if (item.organizer.email != useremail) {
                       i = 1;
                       if (!item.organizer.displayName) {
                            $scope.pcm_gcalevents[index].participantlist[0] = '<' + item.organizer.email + '>';
                            $scope.pcm_gcalevents[index].participants = '\n <' + item.organizer.email + '>';
                       }
                       else {
                            $scope.pcm_gcalevents[index].participantlist[0] = '"' + item.organizer.displayName + '" <' + item.organizer.email + '>';
                            $scope.pcm_gcalevents[index].participants = '\n "' + item.organizer.displayName + '" <' + item.organizer.email + '>';
                            }
                       }
                }
                angular.forEach(item.attendees, function (participant, index2) {
                    if (participant.email != item.organizer.email)
                        if(participant.email!= useremail)
                        {
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
                     $scope.pcm_calevents[index].durationtime = new Date();
                     $scope.pcm_calevents[index].durationtime = $scope.timeDifference($scope.pcm_calevents[index].starttime, $scope.pcm_calevents[index].totime);                     
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

    };

    /**
     * Print the summary and start datetime/date of the next ten events in
     * the authorized user's calendar. If no events are found an
     * appropriate message is printed.
     */
    $scope.importGCalEvents = function () {


    };

    $scope.loadGData = function () {
        $scope.pcm_gcalevents = null;
        $scope.selectedpcm_gcalevent = null;


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
                var l_container = angular.copy(container); 
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

    $scope.pcm_caleventdata = function (pcm_calevent) {
        $scope.selectedpcm_calevent = null;
        if (!pcm_calevent)
            return;

        $scope.selectedpcm_calevent = pcm_calevent;
    };

    $scope.pcm_gcaleventdata = function (pcm_gcalevent) {
        $scope.selectedpcm_gcalevent = null;
        if (!pcm_gcalevent)
            return;

        $scope.selectedpcm_gcalevent = pcm_gcalevent;
    };

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
        $scope.loadGData();

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