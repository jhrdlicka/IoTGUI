var app = angular.module('myApp', ['ngRoute', 'ngCookies', 'ui.bootstrap']);


/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        // Home
        .when("/", { templateUrl: "views/sensorsgui.html", controller: "sensorController" })
        // Pages
        .when("/fetch", { templateUrl: "views/fetch-data.html", controller: "fetchDataController" })
        // else 404
        .otherwise("/404", { templateUrl: "views/shared/404.html", controller: "commonController" });
}]);


/**
 * Common (404 error)
 */
app.controller('commonController', function ($scope, $http, $filter) {
});


/**
 * Google login 
 */
app.controller('GoogleCtrl2', function ($window, $scope, $http) {

    $window.signedIn = false;

    onSuccess = function (googleUser) {
        console.log('Logged in as: ' + googleUser.getBasicProfile().getName());
        var id_token = googleUser.getAuthResponse().id_token;

        if (id_token) {
            $window.signedIn = true;

            // Hide the sign-in button now that the user is authorized, for example:
            //            $('#signinButton').attr('style', 'display: none');

        }

    };

    onFailure = function (error) {
        console.log(error);
    };


    //$window.gapiOnLoadCallback = function () {
    //    gapi.signin2.render('googleLoginButton', {
    //        'scope': 'profile email',            
    //        'longtitle': true,
    //        'theme': 'dark',
    //        'onsuccess': onSuccess,
    //        'onfailure': onFailure
    //    });

    //};

    $scope.signOut = function () {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            $window.signedIn = false;
            // Some UI update
        });
    };
});
