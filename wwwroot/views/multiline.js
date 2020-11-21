/**
 * handling of seletion in lists
 */
app.service('multiline', function ($rootScope) {

    $rootScope.selectRow = function (listid, event, rowIndex) {
        if (event.ctrlKey) {
            changeSelectionStatus(listid, rowIndex);
        } else if (event.shiftKey) {
            selectWithShift(listid, rowIndex);
        } else {
            $rootScope.selectedRowsIndexes[listid] = [rowIndex];
        }
        
        console.log($rootScope.selectedRowsIndexes[listid]);
//        console.log($rootScope.getSelectedRows(listid, $scope.pcm_customers));
//        console.log(getFirstSelectedRow(listid));
        
//        $rootScope.pcm_caleventdata();  // refresh detail
//        $rootScope.pcm_gcaleventdata();
    };

    function selectWithShift(listid, rowIndex) {
        var lastSelectedRowIndexInSelectedRowsList = $rootScope.selectedRowsIndexes[listid].length - 1;
        var lastSelectedRowIndex = $rootScope.selectedRowsIndexes[listid][lastSelectedRowIndexInSelectedRowsList];
        var selectFromIndex = Math.min(rowIndex, lastSelectedRowIndex);
        var selectToIndex = Math.max(rowIndex, lastSelectedRowIndex);
        selectRows(listid, selectFromIndex, selectToIndex);
    }

    $rootScope.getSelectedRows = function (listid, list) {
        var selectedRows = [];
        angular.forEach($rootScope.selectedRowsIndexes[listid], function (rowIndex) {
            selectedRows.push(list[rowIndex]);

            /*
            if (listid == $rootScope.caleventlistid)
                selectedRows.push($rootScope.pcm_gcalevents[rowIndex]);
            if (listid == $rootScope.gcaleventlistid)
                selectedRows.push($rootScope.pcm_gcalevents[rowIndex]);
                */
        });
        return selectedRows;
    }

    $rootScope.getFirstSelectedRow = function(listid, list) {
        var firstSelectedRowIndex = $rootScope.selectedRowsIndexes[listid][0];
        return list[firstSelectedRowIndex];
        /*
        if (listid == $rootScope.caleventlistid) 
            return $rootScope.pcm_calevents[firstSelectedRowIndex];
        if (listid == $rootScope.gcaleventlistid) 
            return $rootScope.pcm_gcalevents[firstSelectedRowIndex];
            */
    }

    function selectRows(listid, selectFromIndex, selectToIndex) {
        for (var rowToSelect = selectFromIndex; rowToSelect <= selectToIndex; rowToSelect++) {
            select(listid, rowToSelect);
        }
    }

    function changeSelectionStatus(listid, rowIndex) {
        if ($rootScope.isRowSelected(listid, rowIndex)) {
            unselect(listid, rowIndex);
        } else {
            select(listid, rowIndex);
        }
    }

    function select(listid, rowIndex) {
        if (!$rootScope.isRowSelected(listid, rowIndex)) {
            $rootScope.selectedRowsIndexes[listid].push(rowIndex)
        }
    }

    function unselect(listid, rowIndex) {
        var rowIndexInSelectedRowsList = $rootScope.selectedRowsIndexes[listid].indexOf(rowIndex);
        var unselectOnlyOneRow = 1;
        $rootScope.selectedRowsIndexes[listid].splice(rowIndexInSelectedRowsList, unselectOnlyOneRow);
    }

    $rootScope.resetSelection = function(listid) {
        $rootScope.selectedRowsIndexes[listid] = [];
    }

    $rootScope.isRowSelected = function (listid, rowIndex) {
        return $rootScope.selectedRowsIndexes[listid].indexOf(rowIndex) > -1;
    };
});

