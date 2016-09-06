(function () {
    'use strict';

    app.controller('PeopleDetailCtrl', ['$scope', '$stateParams',
        function ($scope, $stateParams) {
            $scope.message = $stateParams;
        }]);

})();