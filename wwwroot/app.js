"use strict";

var app = angular.module('myApp', ['ngRoute', 'ngCookies', 'ui.bootstrap']);

app.run(function ($rootScope, $cookies, $http, $window, $locale) {
    $rootScope.run = { packageName: 'run' };
    var myscope = $rootScope.run;

    $rootScope.serverUpdateHubInit = false;

    // register multiline lists and initiate multiline structures
    $rootScope.lastlistid = 0;
    $rootScope.selectedRowsIndexes = [];

    $rootScope.caleventlistid = 1;
    $rootScope.gcaleventlistid = 2;
    $rootScope.customerlistid = 3;
    $rootScope.customerselectlistid = 4;
    $rootScope.orderlistid = 5;
    $rootScope.orderselectlistid = 6;
    $rootScope.invoicelistid = 7;
    $rootScope.invoiceselectlistid = 8;
    $rootScope.paymentlistid = 9;
    $rootScope.paymentselectlistid = 10;
    $rootScope.reftablistid = 11;
    $rootScope.reftabselectlistid = 12;
    $rootScope.referencelistid = 13;
    $rootScope.referenceselectlistid = 14;

    for (var i = 1; i <= 14; i++) {
        $rootScope.selectedRowsIndexes[i] = [];
    }

    // shared parameters
    $rootScope.dateFormat = 'dd.MM.yyyy';
    $rootScope.timeFormat = 'HH:mm';
    $rootScope.precisetimeFormat = 'HH:mm:ss.sss';
    $rootScope.datetimeFormat = 'dd.MM.yyyy HH:mm';
    $rootScope.dateOptions = { startingDay: 1 };

    $locale.NUMBER_FORMATS.GROUP_SEP = " ";
    $locale.NUMBER_FORMATS.DECIMAL_SEP = ",";

    // pagination defaults
    $rootScope.itemsPerPage = 20; 
    $rootScope.maxSize = 5; //Number of pager buttons to show


    $rootScope.isAuthorized = $cookies.get(".AspNetCore.Cookies");

    $rootScope.dateCheckClick = function (pOldValue) {
        var lToday = new Date();
        if (pOldValue)
            return null;
        else
            return lToday;
    }

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


/*
    $rootScope.serverUpdateHub.connection = new signalR.HubConnectionBuilder().withUrl($rootScope.ApiAddress + "/ServerUpdateHub").build();


    $rootScope.serverUpdateHub.connection.on("broadcastMessage", function (user, message) {
        console.log("received SignalR message: ", message);
    });

    $rootScope.serverUpdateHub.connection.start().then(function () {
        console.log("SignalR connection establisthed");
    }).catch(function (err) {
        return console.error(err.toString());
    });
    */

/*
    document.getElementById("sendButton").addEventListener("click", function (event) {
        var user = document.getElementById("userInput").value;
        var message = document.getElementById("messageInput").value;
        connection.invoke("SendMessage", user, message).catch(function (err) {
            return console.error(err.toString());
        });
        event.preventDefault();
    });
    */

//    $window.document.documentElement.clientWidth = 1800;
//    console.log('Current clientWidth : %s', document.body.clientWidth);
//    console.log('Current width : %s', document.body.width);
//    console.log($window.document.documentElement.clientWidth); // 0

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
        .when("/fetch", { templateUrl: "views/fetch-data.html", controller: "fetchDataController" })
        .when("/pcm_customers", { templateUrl: "views/pcm_customersgui.html", controller: "pcm_customercontroller" })
        .when("/pcm_calevents", { templateUrl: "views/pcm_caleventsgui.html", controller: "pcm_caleventcontroller" })
        .when("/pcm_orders", { templateUrl: "views/pcm_ordersgui.html", controller: "pcm_ordercontroller" })
        .when("/pcm_invoices", { templateUrl: "views/pcm_invoicesgui.html", controller: "pcm_invoicecontroller" })
        .when("/pcm_payments", { templateUrl: "views/pcm_paymentsgui.html", controller: "pcm_paymentcontroller" })
        .when("/ker_reftabs", { templateUrl: "views/ker_reftabsgui.html", controller: "ker_reftabcontroller" })
        .when("/ker_references", { templateUrl: "views/ker_referencesgui.html", controller: "ker_referencecontroller" })
        .when("/iot_devices", { mode:"list", templateUrl: "views/iot_devicesgui.html", controller: "iot_devicecontroller" })
        .when("/iot_samples", { mode: "list", templateUrl: "views/iot_samplesgui.html", controller: "iot_samplecontroller" })
        .when("/iot_tasks", { mode: "list", templateUrl: "views/iot_tasksgui.html", controller: "iot_taskcontroller" })
        .when("/lights", { templateUrl: "views/iot_lightsparking.html", controller: "iot_deviceparkingspotcontroller" })
        // else 404
        .otherwise("/404", { templateUrl: "views/shared/404.html", controller: "commonController" });

}]);

app.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
}])

/**
 * Common (404 error)
 */
app.controller('commonController', function ($scope, $http, $filter) {
});


app.service('serverUpdateHub', function ($rootScope) {
    $rootScope.serverUpdateHub = { packageName: 'serverUpdateHub' };
    var myscope = $rootScope.serverUpdateHub;

    $rootScope.serverUpdateHub.init = function () {
        if ($rootScope.serverUpdateHubInit)
            return;

        $rootScope.serverUpdateHubInit = true;

        $rootScope.serverUpdateHub.connection = new signalR.HubConnectionBuilder().withUrl($rootScope.ApiAddress + "ServerUpdateHub").configureLogging(signalR.LogLevel.Information).build();
//        $rootScope.serverUpdateHub.connection = new signalR.HubConnectionBuilder().withUrl("http://www.hrdlicky.eu/ServerUpdateHub").configureLogging(signalR.LogLevel.Information).build();

        async function start() {
            try {
                $rootScope.log(myscope, 'init', "SignalR Connecting (2)...", null, null, "info");     
                await $rootScope.serverUpdateHub.connection.start();
                $rootScope.log(myscope, 'init', "SignalR Connected...", null, null, "success");     
            } catch (err) {
                $rootScope.showerror(myscope, 'serverUpdateHub.init (1)', err);
                setTimeout(start, 5000);
            }
        };

        $rootScope.serverUpdateHub.connection.onclose(start);

        $rootScope.serverUpdateHub.connection.on("broadcastMessage", function (user, message) {
            $rootScope.log(myscope, 'init', message, "SignalR message received", null, "info");     
        });

        start().then(function () {
//            $rootScope.log(myscope, 'init', "SignalR Connection Established", null, null, "success");     
        }).catch(function (error) {
            $rootScope.showerror(myscope, 'serverUpdateHub.init', error);
            return console.error(error.toString());
        });        
    };
});

