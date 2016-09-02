(function () {
    'use strict';
    app.controller('AppCtrl', ['$rootScope', '$scope', '$ionicSideMenuDelegate', '$ionicModal', '$ionicPopover', '$timeout', 'pinService',
		function ($rootScope, $scope, $ionicSideMenuDelegate, $ionicModal, $ionicPopover, $timeout, pinService) {

            // hack google map - sidemenu overlay
		    $scope.$watch(function () {
		        return $ionicSideMenuDelegate.getOpenRatio();
		    }, function (newValue, oldValue) {
		        if (newValue == 0) {
		            $scope.hideLeft = true;
		        } else {
		            $scope.hideLeft = false;
		        }
		    });

		    // Form data for the login modal
		    $scope.loginData = {};

		    var navIcons = document.getElementsByClassName('ion-navicon');
		    for (var i = 0; i < navIcons.length; i++) {
		        navIcons.addEventListener('click', function () {
		            this.classList.toggle('active');
		        });
		    }

		    // .fromTemplate() method
		    var template = '<ion-popover-view>' +
							'   <ion-header-bar>' +
							'       <h1 class="title">My Pin Piece</h1>' +
							'   </ion-header-bar>' +
							'   <ion-content class="padding">' +
							'       Refresh' +
							'   </ion-content>' +
							'</ion-popover-view>';

		    $scope.popover = $ionicPopover.fromTemplate(template, {
		        scope: $scope
		    });
		    $scope.closePopover = function () {
		        $scope.popover.hide();
		    };
		    //Cleanup the popover when we're done with it!
		    $scope.$on('$destroy', function () {
		        $scope.popover.remove();
		    });
		}]);

})();
