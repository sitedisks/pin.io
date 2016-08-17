(function () {
    'use strict';

    app.controller('MapController', ['$scope', '$cordovaGeolocation', '$ionicLoading', '$ionicPlatform',
        function ($scope, $cordovaGeolocation, $ionicLoading, $ionicPlatform) {

            $ionicPlatform.ready(function () {

                $ionicLoading.show({
                    template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
                });

                var posOptions = {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0
                };

                $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
                    var lat = position.coords.latitude;
                    var long = position.coords.longitude;

                    var myLatlng = new google.maps.LatLng(lat, long);

                    var mapOptions = {
                        center: myLatlng,
                        zoom: 16,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    };

                    var map = new google.maps.Map(document.getElementById("map"), mapOptions);

                    $scope.map = map;

                    //Wait until the map is loaded
                    google.maps.event.addListenerOnce($scope.map, 'idle', function () {

                        var marker = new google.maps.Marker({
                            map: $scope.map,
                            animation: google.maps.Animation.DROP,
                            position: myLatlng
                        });

                        var infoWindow = new google.maps.InfoWindow({
                            content: "Welcome! Pinner."
                        });

                        google.maps.event.addListener(marker, 'click', function () {
                            infoWindow.open($scope.map, marker);
                        });

                    });


                    $ionicLoading.hide();

                }, function (err) {
                    $ionicLoading.hide();
                    console.log(err);
                });
            });
        }]);

})();