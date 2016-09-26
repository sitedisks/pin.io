(function () {
    'use strict';
    app.controller('HomeCtrl', ['$rootScope', '$scope', '$stateParams', '$cordovaDevice', '$cordovaGeolocation', '$cordovaCamera', '$ionicPopup', '$ionicPlatform', '$ionicModal', 'pinService', 'PinColor', 'defaultLocation', 'pagination', 's3Image',
        function ($rootScope, $scope, $stateParams, $cordovaDevice, $cordovaGeolocation, $cordovaCamera, $ionicPopup, $ionicPlatform, $ionicModal, pinService, PinColor, defaultLocation, pagination, s3Image) {


            //var lat = -37.81198361286847, lng = 144.96133938623052;
            var token;
            var map;
            var mapDiv = document.getElementById("map");
            var currentLat = defaultLocation.lat;
            var currentLng = defaultLocation.lng;
            var markersArray = [];
            var commentPage = 1;
            var commentTotal = -1;

            $ionicPlatform.ready(function () {

                try {
                    token = $cordovaDevice.getUUID();
                }
                catch (err) {
                    console.log("Error " + err.message);
                }
                finally {
                    token = 'not-real-device-test-only';
                }

                $scope.PinLoad = PinLoad;

                PinLoad();

                function PinLoad() {

                    pinService.loading(); // spin loading

                    var posOptions = {
                        enableHighAccuracy: true,
                        timeout: 20000,
                        maximumAge: 0
                    };

                    // start the geolocation 
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {

                        currentLat = position.coords.latitude;
                        currentLng = position.coords.longitude;
                        var positionData = {
                            "Token": token,
                            "Coord": {
                                "lng": currentLng,
                                "lat": currentLat
                            }
                        };

                 

                        /* native google map */
                        map = plugin.google.maps.Map.getMap(mapDiv, {
                            'camera': {
                                'latLng': setNativePosition(currentLat, currentLng),
                                'zoom': 12
                            }
                        });

                        //var infowindow = new google.maps.InfoWindow();
                        //var markersArray = [];
                        var bounds = new google.maps.LatLngBounds();
                        map.clear();
                        $scope.map = map;

 
                        // native map ready
                        map.addEventListener(plugin.google.maps.event.MAP_READY, onNativeMapReady);

                        // map ready
                    
                        function onNativeMapReady() {
                            var currentMarker = {
                                position: setNativePosition(currentLat, currentLng),
                                icon: 'blue',
                                title: 'Your current location -> lat: ' + currentLat + ', lng: ' + currentLng
                            };

                            $scope.map.addMarker({
                                'marker': currentMarker,
                                'position': currentMarker.position,
                                'icon': currentMarker.icon,
                                animation: plugin.google.maps.Animation.DROP
                            }, function (marker) {
                                //  marker.showInfoWindow();
                                marker.on('click', function () {
                                    alert(marker.get('marker').title);
                                });
                            });

                            markersArray.push(currentMarker);

                            // reload
                            pinService.reload().refresh(positionData,
                             function (data) {
                                 if (data.length > 0) {
                                     angular.forEach(data, function (pin) {
                                         addNativeMarker(pin);
                                     });

                                   
                                     var latLngBounds = new plugin.google.maps.LatLngBounds(markersArray);
                                     $scope.map.setCenter(setNativePosition(currentLat, currentLng));
                                     $scope.map.animateCamera({
                                         'target': latLngBounds
                                     });
                                   
                                 }

                          
                                 pinService.hideloading();
                             },
                             function (error) {
                                 // failed to load api
                             
                                 pinService.hideloading();
                             });

                        }


                        // add markers (pin)
              
                        function addNativeMarker(pin) {
                            if (pin.IsReadable) {
                                var marker = {
                                    position: setNativePosition(pin.Latitude, pin.Longitude),
                                    icon: 'green',
                                    title: 'Pin location -> lat: ' + pin.Latitude + ', lng: ' + pin.Longitude
                                };
                            }
                            else {
                                var marker = {
                                    position: setNativePosition(pin.Latitude, pin.Longitude),
                                    icon: 'yellow',
                                    title: 'Pin location -> lat: ' + pin.Latitude + ', lng: ' + pin.Longitude
                                };
                            }


                            $scope.map.addMarker({
                                'marker': marker,
                                'position': marker.position,
                                'icon': marker.icon
                            }, function (marker) {
                                //  marker.showInfoWindow();
                                marker.on('click', function () {

                                    // api load pin details
                                    pinService.loadPin().get({ pinId: pin.Id },
                                        function (pinData) {
                                            if (pinData.Id != null)
                                                alert(pinData.Text);
                                            else
                                                alert("Pin info not in mysql");
                                        }, function (error) {
                                            //log the error
                                            alert(marker.get('marker').title);
                                        });

                                    //alert(marker.get('marker').title);
                                });
                            });

                            markersArray.push(marker);
                        }

                        // set latLng
                        function setPosition(lat, lng) {
                            return new google.maps.LatLng(lat, lng);
                        }

                        function setNativePosition(lat, lng) {
                            return new plugin.google.maps.LatLng(lat, lng);
                        }



                        // start camera
                        $scope.takeImage = function () {
                            var options = {
                                quality: 80,
                                destinationType: Camera.DestinationType.DATA_URL,
                                sourceType: Camera.PictureSourceType.CAMERA,
                                allowEdit: true,
                                encodingType: Camera.EncodingType.JPEG,
                                targetWidth: 350,
                                targetHeight: 350,
                                popoverOptions: CameraPopoverOptions,
                                saveToPhotoAlbum: false
                            };

                            $cordovaCamera.getPicture(options).then(function (imageData) {
                                $scope.srcImage = "data:image/jpeg;base64," + imageData;
                            }, function (err) {
                                // error
                            });
                        }

                        // choose from album
                        $scope.chooseImage = function () {
                            var options = {
                                quality: 80,
                                destinationType: Camera.DestinationType.DATA_URL,
                                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                                allowEdit: true,
                                encodingType: Camera.EncodingType.JPEG,
                                targetWidth: 350,
                                targetHeight: 350,
                                popoverOptions: CameraPopoverOptions,
                                saveToPhotoAlbum: false
                            };

                            $cordovaCamera.getPicture(options).then(function (imageData) {
                                $scope.srcImage = "data:image/jpeg;base64," + imageData;
                            }, function (err) {
                                // error
                            });
                        }

                        // add new post pin
                        $scope.newPin = {
                            message: '',
                            isPrivate: false
                        };

                        $ionicModal.fromTemplateUrl('post-new-pin.html', {
                            scope: $scope,
                            animation: 'slide-in-up'
                        }).then(function (modal) {
                            $scope.modal = modal;
                        });

                        $scope.openModal = function () {
                            $scope.map.setClickable(false);
                            $scope.modal.show();
                        }

                        $scope.closeModal = function () {
                            $scope.modal.hide();
                            $scope.map.setClickable(true);
                        };

                        $scope.postNewPin = function (newpin) {

                            var pin = {
                                "Token": token,
                                "Longitude": currentLng,
                                "Latitude": currentLat,
                                "Text": newpin.message,
                                "IsPrivate": newpin.isPrivate
                            };

                            pinService.postPin().save(pin,
                                function (data) {
                                    // new pin stored in mysql and mongo
                                    $scope.modal.hide();
                                    $scope.map.setClickable(true);
                                    //PinLoad();
                                }, function (error) {
                                    // error handle
                                });

                        }

                    }, function (err) {
                        //$ionicLoading.hide();
                        pinService.hideloading();
                        console.log(err);
                    });
                }


            });

        }]);
})();

/*
map.addMarker({
    'position': GOOGLE_TOKYO,
    'title': 'Google Tokyo!'
}, function (marker) {
    marker.setIcon({
        'url': 'http://.../image.png',
        'size': {
            width: 75,
            height: 75
        }
    });
});*/