/**
 * handling of seletion in lists
 */
app.service('ker_reference', function ($rootScope, $filter, $http, $q, multiline, guialert, model_ker_reference) {
    $rootScope.ker_reference = { packageName: 'ker_reference' };
    var myscope = $rootScope.ker_reference;
    
    $rootScope.kerReftabGetList = function (pReftabNM) {
        var lReftabs = $filter('filter')($rootScope.ker_reftabs, { 'reftabnm': pReftabNM });

        var lList = [];
        lList.push({ Value: null, Text: "--" + lReftabs[0].name + "--" });
        angular.forEach(lReftabs[0].xreferences, function (item, lIndex) {
            lList.push({ Value: item.namenm, Text: item.name });
        });
        return lList;
    };

    $rootScope.kerReftabGetNameByNM = function (pReftabNM, pNameNM) {
        if (!pNameNM ||!$rootScope.ker_reftabs) {
            return "";
        }

        var lReftab = $filter('filter')($rootScope.ker_reftabs, { 'reftabnm': pReftabNM });
        var lReference = $filter('filter')(lReftab[0].xreferences, { 'namenm': pNameNM });
        if ((!lReftab)|| (!lReference)){
            return "???";
        }

        if ((lReference.length == 1) && (lReftab.length==1))
            return lReference[0].name;
        else {
            console.error("Reference item not found", pReftabNM + "/" + pNameNM);
            return "???";
        }
    };

    $rootScope.kerReftabGetByNM = function (pReftabNM, pNameNM) {
        if (!pNameNM || !$rootScope.ker_reftabs) {
            return null;
        }

        var lReftab = $filter('filter')($rootScope.ker_reftabs, { 'reftabnm': pReftabNM });
        var lReference = $filter('filter')(lReftab[0].xreferences, { 'namenm': pNameNM });
        if ((!lReftab) || (!lReference)) {
            return "???";
        }

        if ((lReference.length == 1) && (lReftab.length == 1))
            return lReference[0].name;
        else {
            console.error("Reference item not found", pReftabNM + "/" + pNameNM);
            return null;
        }
    };

    $rootScope.kerReftabInit = function () {
        $rootScope.model_ker_reference.loadData(false);
    };

    $rootScope.kerReftabInit();

});

