var app = angular.module('myApp', ['ngRoute', 'ngCookies', 'ui.bootstrap']);

app.run(function ($rootScope, $cookies, $http, $window, $locale) {

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
    $rootScope.datetimeFormat = 'dd.MM.yyyy HH:mm';
    $rootScope.dateOptions = { startingDay: 1 };

    $locale.NUMBER_FORMATS.GROUP_SEP = " ";
    $locale.NUMBER_FORMATS.DECIMAL_SEP = ",";

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
        .when("/sensors", { templateUrl: "views/sensorsgui.html", controller: "sensorController" })
        .when("/fetch", { templateUrl: "views/fetch-data.html", controller: "fetchDataController" })
        .when("/pcm_customers", { templateUrl: "views/pcm_customersgui.html", controller: "pcm_customercontroller" })
        .when("/pcm_calevents", { templateUrl: "views/pcm_caleventsgui.html", controller: "pcm_caleventcontroller" })
        .when("/pcm_orders", { templateUrl: "views/pcm_ordersgui.html", controller: "pcm_ordercontroller" })
        .when("/pcm_invoices", { templateUrl: "views/pcm_invoicesgui.html", controller: "pcm_invoicecontroller" })
        .when("/pcm_payments", { templateUrl: "views/pcm_paymentsgui.html", controller: "pcm_paymentcontroller" })
        .when("/ker_reftabs", { templateUrl: "views/ker_reftabsgui.html", controller: "ker_reftabcontroller" })
        .when("/ker_references", { templateUrl: "views/ker_referencesgui.html", controller: "ker_referencecontroller" })
        .when("/iot_devices", { templateUrl: "views/iot_devicesgui.html", controller: "iot_devicecontroller" })
        // else 404
        .otherwise("/404", { templateUrl: "views/shared/404.html", controller: "commonController" });

}]);


/**
 * Common (404 error)
 */
app.controller('commonController', function ($scope, $http, $filter) {
});
