/**
 * handling of seletion in lists
 */
app.service('ker_reference', function ($rootScope, $filter, $http, $q, multiline, guialert) {
    //    $scope.controllerName = null;
    var myscope = { packageName: 'ker_reference' };
    
    var promises = [];

    function getreferences(pIndex) {
        var lId = $rootScope.ker_reftabs[pIndex].id;

        promise = $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reference/reftabnm/" + $rootScope.ker_reftabs[pIndex].reftabnm,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                if (!$rootScope.ker_reftabs || !$rootScope.ker_reftabs[pIndex] || $rootScope.ker_reftabs[pIndex].id != lId) {
                    //                    console.log("invalid pointer - probably double refresh (4)", caleventindex, $rootScope.ker_reftabs);                    
                }
                else {
                    $rootScope.ker_reftabs[pIndex].references = response.data;
                }
                console.log("references loaded");

            }, function error(error) {
                $rootScope.showerror(myscope, 'getreferences', error);
                $rootScope.ker_reftabs[pIndex].references = null;
            });
        return $q.all([promise]);

    };

    function postImport(pIndex) {
        $rootScope.ker_reftabs[pIndex].index = pIndex;
        var promise = getreferences(pIndex)
            .then(function success(response) {
//                console.log("postimport finished");
        });
        return $q.all([promise]);
    }


    $rootScope.kerReftabLoadData = function () {
        $rootScope.ker_reftabs = null;
        $rootScope.resetSelection($rootScope.reftablistid);

        var promise=$http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reftab",
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                var lData = response.data;
                $rootScope.ker_reftabs = lData;

                $rootScope.resetSelection($rootScope.reftablistid);
                var promises1 = [];
                angular.forEach($rootScope.ker_reftabs, function (item, lIndex) {
                    var promise2 = postImport(lIndex).then(function success(response) {
                        return response.$promise;
                    });
                    promises1.push(promise2);
                });                
                return $q.all(promises1);

            }, function error(error) {
                    $rootScope.showerror(myscope, 'kerReferenceLoadData', error);
            });
        promises.push(promise);

        $q.all(promises).then(function (promiseArray) {
            console.log("reftab loaded");
            return $q.all(promises);
        });    

        
    };

    $rootScope.kerReftabLoadRecord = function (pIndex) {
        l_id = $rootScope.ker_reftabs[pIndex].id;
        $rootScope.ker_reftabs[pIndex] = null;

        $http({
            headers: { "Content-Type": "application/json" },
            url: $rootScope.ApiAddress + "api/ker_reftab/" + l_id,
            withCredentials: true,
            method: 'GET'
        })
            .then(function success(response) {
                var lData = response.data;
                $rootScope.ker_reftabs[pIndex] = lData;
                if (lData.id == l_id)
                    postImport(pIndex);                    
                else
                    $rootScope.kerReftabLoadData();
            }, function error(error) {
                    $rootScope.showerror(myscope, 'kerReftabLoadRecord', error);
            });
    };

    $rootScope.kerReftabGetList = function (pReftabNM) {
        var promise=$q.all(promises).then(function (result) {
            var lReftabs = $filter('filter')($rootScope.ker_reftabs, { 'reftabnm': pReftabNM });

            var lList = [];
            lList.push({ Value: null, Text: "--" + lReftabs[0].name + "--" });
            angular.forEach(lReftabs[0].references, function (item, lIndex) {
                lList.push({ Value: item.namenm, Text: item.name });
            });
            console.log("list fetched");
            return lList;

        });
        return $q.all([promise]);
    };

    $rootScope.kerReftabGetNameByNM = function (pReftabNM, pNameNM) {
//        console.log('kerReftabGetByNM', pReftabNM + "/" + pNameNM);        
        if (!pNameNM ||!$rootScope.ker_reftabs) {
            return "";
        }
        var lReftab = $filter('filter')($rootScope.ker_reftabs, { 'reftabnm': pReftabNM});
        var lReference = $filter('filter')(lReftab[0].references, { 'namenm': pNameNM });
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
        console.log('kerReftabGetByNM', pReftabNM + "/" + pNameNM);
        var promise = $q.all(promises).then(function (result) {
            if (!pNameNM) {
                var lReturn = {};
                return null;
                return lReturn;
            }
            var lReference = $filter('filter')($rootScope.ker_reference, { 'reftabnm': pReftabNM, 'namenm': pNameNM });

            if (lReference.length == 1)
                return lReference[0];
            else {
                console.error("Reference item not found", pReftabNM + "/" + pNameNM );
                return null;
            }                
        });
        return $q.all([promise]);
    };

    $rootScope.kerReftabInit = function () {
        console.log("kerReftabInit");
    }

    $rootScope.kerReftabLoadData();
});

