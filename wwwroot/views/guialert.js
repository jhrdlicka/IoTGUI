/**
 * handling of seletion in lists
 */
app.service('guialert', function ($rootScope, $q, $uibModal) {

    $rootScope.showerror = function (callscope, modulenm, error) {
        if (!error)
            error = { status: 0 };

        if (error.status == 401)
            alert("Access Denied!!!")
        else
            alert("Unknown Error");
        console.error({ module: callscope.controllerName ? callscope.controllerName : callscope.packageName, function: modulenm, error: error })
        $rootScope.showtoast("error", error, callscope.packageName+"."+modulenm+" error"); 
    }

    $rootScope.showalert = function (type, title, text, button1, button2, button3) {
        if (type == 'error') {
            alert(text);
            return;
        }

        if (type == 'confirm') {
            l_return = confirm(text);
            return l_return;
        }
    }

    $rootScope.log = function (callscope, modulenm, text, param) {
        console.log(text, param);
        $rootScope.showtoast("info", text, callscope.packageName + "." + modulenm + " info");
    }


    $rootScope.showtoast = function (pType, pMessage, pTitle) {
        toastr.options = {
            "closeButton": true,
            "debug": true,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-bottom-right",
            "preventDuplicates": true,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
        toastr[pType](pMessage, pTitle);
//        toastr.info('Are you the 6 fingered man?')
    }


    $rootScope.entitySelect = function (entity, multilineallowed) {
        var defer = $q.defer();
        var modalInstance = $uibModal.open({
            templateUrl: 'views/' + entity + 'select.html',
            controller: entity + 'selectcontroller',
            size: 'xl',
            backdrop: 'static',
            resolve: {
                multilineallowed: function () {
                    return multilineallowed;
                }
            }
        });

        modalInstance.result.then(function (container) {
            /* ok */
            defer.resolve(container);
        }, function (error) {
            /* cancel */
            defer.reject(error);
        });

        return defer.promise;
    };


});

