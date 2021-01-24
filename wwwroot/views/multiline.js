/**
 * handling of seletion in lists
 */
app.service('multiline', function ($rootScope) {

    $rootScope.selectRow = function (listid, event, rowIndex, multilineallowed) {
        if (event.ctrlKey && multilineallowed) {
            changeSelectionStatus(listid, rowIndex);
        } else if (event.shiftKey && multilineallowed) {
            selectWithShift(listid, rowIndex);
        } else {
            $rootScope.selectedRowsIndexes[listid] = [rowIndex];
        }
        
//        console.log("listid:", listid);
//        console.log($rootScope.selectedRowsIndexes[listid]);
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
        });
        return selectedRows;
    }

    $rootScope.getFirstSelectedRow = function(listid, list) {
        var firstSelectedRowIndex = $rootScope.selectedRowsIndexes[listid][0];
        return list[firstSelectedRowIndex];
    }

    function selectRows(listid, selectFromIndex, selectToIndex) {
        var myTab = document.getElementById('table.'+listid);
        var selectedRow = false;
        // LOOP THROUGH EACH ROW OF THE TABLE AFTER HEADER.
        for (i = 1; i < myTab.rows.length; i++) {
            rowid = myTab.rows.item(i).id;
            rowindex = parseInt(rowid.substring(rowid.indexOf(":")+1));

            if ((myTab.rows.item(i).id == 'tr.' + listid + ':' + selectFromIndex) || (myTab.rows.item(i).id == 'tr.' + listid + ':' + selectToIndex)) {
                if (selectedRow) { // last selected row
                    select(listid, rowindex);
                    selectedRow = false;
                } else {  // first selected row
                    selectedRow = true;
                }
            }
            if (selectedRow) {
                select(listid, rowindex);
            }
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

