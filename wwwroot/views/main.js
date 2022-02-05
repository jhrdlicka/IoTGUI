app.controller('mainController', function ($scope, $http, $filter, $uibModal, $cookies, $window, $location, $rootScope) {

    $scope.loadData = function () {
        // refresh dashboard
    }

    $.urlParam = function (name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results == null) {
            return null;
        }
        else {
            return decodeURI(results[1]) || 0;
        }
    }

//    $rootScope.isAuthorized = $cookies.get(".AspNetCore.Cookies");
    var token = $.urlParam("token");
    if (token && !$rootScope.isAuthorized) {
//        $cookies.put(".AspNetCore.Cookies", token);
        $rootScope.isAuthorized = true;
    }
//    else // dirty hack!!!
//        $rootScope.isAuthorized = true;

    $scope.googleLogin = function () {
        const url = $rootScope.ApiAddress + "account/google-login?redirectUrl=" + encodeURIComponent(window.location.href);

        window.location.replace(url);
    }


    $scope.googleLogout = function () {

        const url = "http://accounts.google.com/Logout?redirectUrl=" + encodeURIComponent(window.location.href);

        window.open(url);
//        window.location.replace(url);

//        $location.search('token', null);

//        var auth2 = gapi.auth2.getAuthInstance();
//        auth2.signOut().then(function ()
//        myAuth.signOut().then(function ()
//        {
            $cookies.remove(".AspNetCore.Cookies");
            $rootScope.isAuthorized = false;
//        }, (error) => {
//            console.log("error:", error);
//        });
    }

    $scope.testAuthorize = function () {
        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/TestAuthorize",
            withCredentials: true,            
            method: 'GET'
        })
            .then(function success(response) {
                console.log(response);
                alert(response.data);
            }, function error(error) {
                console.error('error', error);
            });
    }

    $scope.loadData();


});

