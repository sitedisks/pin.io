(function () {
    'use strict';
    app.controller('HomeCtrl', ['$rootScope', '$scope', '$stateParams', '$cordovaDevice', '$cordovaGeolocation', '$cordovaCamera', '$ionicLoading', '$ionicPlatform', '$ionicModal', 'pinService', 'PinColor',
        function ($rootScope, $scope, $stateParams, $cordovaDevice, $cordovaGeolocation, $cordovaCamera, $ionicLoading, $ionicPlatform, $ionicModal, pinService, PinColor) {


            //var lat = -37.81198361286847, lng = 144.96133938623052;
            var token = 'peter-test-galaxy-edge-7-002';
            var map;
            var mapDiv = document.getElementById("map");

            $ionicPlatform.ready(function () {

                try {
                    token = $cordovaDevice.getUUID();
                }
                catch (err) {
                    console.log("Error " + err.message);
                }

                $scope.PinLoad = PinLoad;

                PinLoad();

                function PinLoad() {

                    $ionicLoading.show({
                        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
                    });

                    var posOptions = {
                        enableHighAccuracy: true,
                        timeout: 20000,
                        maximumAge: 0
                    };

                    // start the geolocation 
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {

                        var lat = position.coords.latitude;
                        var lng = position.coords.longitude;
                        var positionData = {
                            "Token": token,
                            "Coord": {
                                "lng": lng,
                                "lat": lat
                            }
                        };

                        /* javascript google map 
                        map = new google.maps.Map(mapDiv, {
                            center: setPosition(lat, lng),
                            zoom: 16,
                            disableDefaultUI: true,
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        });*/

                        /* native google map */
                        map = plugin.google.maps.Map.getMap(mapDiv, {
                            'camera': {
                                'latLng': setNativePosition(lat, lng),
                                'zoom': 12
                            }
                        });

                        var infowindow = new google.maps.InfoWindow();
                        var markersArray = [];
                        var bounds = new google.maps.LatLngBounds();
                        map.clear();
                        $scope.map = map;


                        // js map ready
                        //google.maps.event.addListenerOnce($scope.map, 'idle', onMapReady);

                        // native map ready
                        map.addEventListener(plugin.google.maps.event.MAP_READY, onNativeMapReady);

                        // map ready
                        function onMapReady() {
                            var pinColor = PinColor.success;
                            var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                                    null, /* size is determined at runtime */
                                    null, /* origin is 0,0 */
                                    null, /* anchor is bottom center of the scaled image */
                                    new google.maps.Size(31.5, 51)
                                );

                            var meMarker = new google.maps.Marker({
                                map: $scope.map,
                                animation: google.maps.Animation.DROP,
                                position: setPosition(lat, lng),
                                icon: pinImage
                            });

                            // reload
                            pinService.reload().save(positionData,
                                function (data) {
                                    if (data.length > 0) {
                                        angular.forEach(data, function (pin) {
                                            addMarker(pin);
                                        });

                                        $scope.map.setCenter(bounds.getCenter());
                                        $scope.map.fitBounds(bounds);
                                        $scope.map.setZoom(map.getZoom());
                                    }

                                    $ionicLoading.hide();
                                },
                                function (error) {
                                    // failed to load api
                                    $ionicLoading.hide();
                                });
                        }

                        function onNativeMapReady() {
                            var currentMarker = {
                                position: setNativePosition(lat, lng),
                                icon: 'blue',
                                title: 'Your current location -> lat: ' + lat + ', lng: ' + lng
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
                            pinService.reload().save(positionData,
                             function (data) {
                                 if (data.length > 0) {
                                     angular.forEach(data, function (pin) {
                                         addNativeMarker(pin);
                                     });

                                   
                                     var latLngBounds = new plugin.google.maps.LatLngBounds(markersArray);
                                     $scope.map.setCenter(setNativePosition(lat, lng));
                                     $scope.map.animateCamera({
                                         'target': latLngBounds
                                     });
                                     //$scope.map.setZoom(map.getZoom());

                                     //$scope.map.setCenter(bounds.getCenter());
                                     //$scope.map.fitBounds(bounds);
                                     //$scope.map.setZoom(map.getZoom());
                                 }

                                 $ionicLoading.hide();
                             },
                             function (error) {
                                 // failed to load api
                                 $ionicLoading.hide();
                             });

                        }


                        // add markers (pin)
                        function addMarker(pin) {
                            var readPinColor = PinColor.info;
                            var readPinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + readPinColor,
                               null, /* size is determined at runtime */
                               null, /* origin is 0,0 */
                               null, /* anchor is bottom center of the scaled image */
                               new google.maps.Size(31.5, 51)
                           );

                            var markerLatLng = new google.maps.LatLng(pin.Latitude, pin.Longitude);
                            bounds.extend(markerLatLng);

                            var tipHtml = "<h5>Pin Piece:</h5> User:" + pin.UserId + "<h5>Token:" + pin.Token + "</h5><br/>What been told: " + pin.Text;
                            if (pin.Distance) {
                                if (pin.IsReadable)
                                    tipHtml += "<h4>Readable</h4>";
                                else {
                                    tipHtml += "<h4>Too far away</h4><h5>distance: " + pin.Distance + " M</h5>";
                                }
                            }

                            if (pin.IsReadable) {
                                var marker = new google.maps.Marker({
                                    position: markerLatLng,
                                    map: map,
                                    title: pin.Token,
                                    icon: readPinImage,
                                    infowindow: infowindow
                                });
                            } else {
                                var marker = new google.maps.Marker({
                                    position: markerLatLng,
                                    map: map,
                                    title: pin.Token,
                                    infowindow: infowindow
                                });
                            }

                            google.maps.event.addListener(marker, 'click', function () {

                                pinService.pinSvc().get({ pinId: pin.Id },
                                        function (pinData) {
                                            if (pinData.Id != null)
                                                alert(pinData.Text);
                                            else
                                                alert("Pin info not in mysql");
                                        }, function (error) {
                                            //log the error
                                        });

                                //this.infowindow.setContent(tipHtml);
                                //this.infowindow.open(map, this);
                            });

                            markersArray.push(marker);
                        }

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
                                "Longitude": lng,
                                "Latitude": lat,
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
                        $ionicLoading.hide();
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