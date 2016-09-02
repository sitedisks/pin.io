(function () {
    'use strict';
    app.controller('InkCtrl', ['$scope', '$stateParams', 'ionicMaterialInk',
        function ($scope, $stateParams, ionicMaterialInk) {
            //ionic.material.ink.displayEffect();
            ionicMaterialInk.displayEffect();
        }]);

})();
