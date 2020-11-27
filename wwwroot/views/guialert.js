/**
 * handling of seletion in lists
 */
app.service('guialert', function ($rootScope) {

    $rootScope.showerror = function (callscope, modulenm, error) {
        if (!error)
            error = { status: 0 };

        if (error.status == 401)
            alert("Access Denied!!!")
        else
            alert("1: Unknown Error");
        console.error('Controller:' + callscope.controllerName + ' Module: ' + modulenm + ' error', error);
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

});

