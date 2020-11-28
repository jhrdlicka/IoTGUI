var app = angular.module('myApp', ['ngRoute', 'ngCookies', 'ui.bootstrap']);

app.run(function ($rootScope, $cookies, $http, $window) {

    // register multiline lists and initiate multiline structures
    $rootScope.caleventlistid = 1;
    $rootScope.gcaleventlistid = 2;
    $rootScope.customerlistid = 3;
    $rootScope.customerselectlistid = 4;

    $rootScope.selectedRowsIndexes = [];
    for (var i = 1; i <= 4; i++) {
        $rootScope.selectedRowsIndexes[i] = [];
    }


    $rootScope.isAuthorized = $cookies.get(".AspNetCore.Cookies");


    // read environment configuration data
    $http({
        method: 'GET',
        url: '/api/Configuration/ConfigurationData'
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        $rootScope.ApiAddress = response.data.ApiAddress;
        console.log("ApiAddress", $rootScope.ApiAddress);
        $rootScope.CLIENT_ID = response.data.CLIENT_ID;
        $rootScope.API_KEY = response.data.API_KEY;

    }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

//    $window.document.documentElement.clientWidth = 1800;
    console.log('Current clientWidth : %s', document.body.clientWidth);
    console.log('Current width : %s', document.body.width);
    console.log($window.document.documentElement.clientWidth); // 0

    //using defineProperty
//    Object.defineProperty(dom.window.HTMLHtmlElement.prototype, 'clientWidth', { value: 1234 });
});

/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider, $rootScope) {
    $routeProvider
        // Home
        .when("/", { templateUrl: "views/main.html", controller: "mainController" })
        // Pages
        .when("/sensors", { templateUrl: "views/sensorsgui.html", controller: "sensorController" })
        .when("/fetch", { templateUrl: "views/fetch-data.html", controller: "fetchDataController" })
        .when("/pcm_customers", { templateUrl: "views/pcm_customersgui.html", controller: "pcm_customercontroller" })
        .when("/pcm_calevents", { templateUrl: "views/pcm_caleventsgui.html", controller: "pcm_caleventcontroller" })
        // else 404
        .otherwise("/404", { templateUrl: "views/shared/404.html", controller: "commonController" });

}]);


/**
 * Common (404 error)
 */
app.controller('commonController', function ($scope, $http, $filter) {
});
