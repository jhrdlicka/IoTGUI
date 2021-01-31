/**
 * handling of seletion in lists
 */
app.service('guialert', function ($rootScope, $q, $uibModal) {
    $rootScope.lastModalInstance = 0;
    $rootScope.modalInstance = [];

    $rootScope.showerror = function (callscope, modulenm, error) {
        if (!error)
            error = { status: 0 };

        if (error.status == 401)
            $rootScope.showtoast("error", "Access Denied!!!", callscope.packageName + "." + modulenm + " error"); 
        else
            $rootScope.showtoast("error", error.status+ " " + error.statusText, callscope.packageName + "." + modulenm + " error"); 
            
        console.error({ module: callscope.controllerName ? callscope.controllerName : callscope.packageName, function: modulenm, error: error })
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

    $rootScope.log = function (callscope, modulenm, text, param, detailmsg, toasttype) {
        console.log(text, param, detailmsg);
        if (toasttype!=null)
          $rootScope.showtoast(toasttype, text, callscope.packageName + "." + modulenm + " info", detailmsg);
    }


    $rootScope.showtoast = function (pType, pMessage, pTitle, pDetailMsg) {
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
        var lInstance = $rootScope.lastModalInstance++;

        $rootScope.modalInstance[lInstance] = $uibModal.open({
            templateUrl: 'views/' + entity + 'sgui.html',
            controller: entity + 'controller',
            size: 'xl',
            backdrop: 'static',
            resolve: {
                multilineallowed: function () {
                    return multilineallowed;
                },
                mode: function () {
                    return "select";
                },
                instance: function () {
                    return lInstance;
                }
            }
        });

        $rootScope.modalInstance[lInstance].result.then(function (container) {
            /* ok */
            defer.resolve(container);
        }, function (error) {
            /* cancel */
            defer.reject(error);
        });

        return defer.promise;
    };


});

