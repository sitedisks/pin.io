(function () {
    'use strict';
    app.controller('HomeWebCtrl', ['$rootScope', '$scope', '$stateParams', '$cordovaDevice', '$cordovaGeolocation', '$cordovaCamera', '$ionicPlatform', '$ionicModal', 'pinService', 'PinColor', 'defaultLocation',
        function ($rootScope, $scope, $stateParams, $cordovaDevice, $cordovaGeolocation, $cordovaCamera, $ionicPlatform, $ionicModal, pinService, PinColor, defaultLocation) {

            var token;
            var map;
            var mapDiv = document.getElementById("map");
            var currentLat = defaultLocation.lat;
            var currentLng = defaultLocation.lng;
            var markersArray = [];

            // 1> device ready
            $ionicPlatform.ready(function () {

                $scope.newPin = {
                    message: '',
                    isPrivate: false
                };

                $scope.locationLoad = locationLoad;
                $scope.takeImage = takeImage;
                $scope.chooseImage = chooseImage;
                $scope.openNewPinModal = openNewPinModal;
                $scope.closeNewPinModal = closeNewPinModal;
                $scope.openPinDetailsModal = openPinDetailsModal;
                $scope.closePinDetailsModal = closePinDetailsModal;
                $scope.postNewPin = postNewPin;
                $scope.postNewComment = postNewComment;

                // functions
                function locationLoad() {

                    deleteMarkers();

                    pinService.loading(); // spin loading

                    var posOptions = {
                        enableHighAccuracy: true,
                        timeout: 20000,
                        maximumAge: 0
                    };

                    // 2> location ready
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
                        // use device location
                        currentLat = position.coords.latitude;
                        currentLng = position.coords.longitude;
                        MapLoad();
                    }, function (err) {
                        // use default location
                        MapLoad();
                    });
                }

                function tokenLoad() {
                    try {
                        token = $cordovaDevice.getUUID();
                    }
                    catch (err) {
                        console.log("Error " + err.message);
                    }
                    finally {
                        token = 'not-real-device-test-only';
                    }
                }

                function MapLoad() {

                    //var infowindow = new google.maps.InfoWindow();
                    var bounds = new google.maps.LatLngBounds();

                    /* javascript google map */
                    map = new google.maps.Map(mapDiv, {
                        center: setPosition(currentLat, currentLng),
                        zoom: 16,
                        //disableDefaultUI: true,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });

                    $scope.map = map;

                    // js map ready
                    google.maps.event.addListenerOnce($scope.map, 'idle', onMapReady);

                    // map ready
                    function onMapReady() {
                        var pinColor = PinColor.info;
                        var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                                null, /* size is determined at runtime */
                                null, /* origin is 0,0 */
                                null, /* anchor is bottom center of the scaled image */
                                new google.maps.Size(31.5, 51)
                            );

                        var meMarker = new google.maps.Marker({
                            map: $scope.map,
                            animation: google.maps.Animation.DROP,
                            position: setPosition(currentLat, currentLng),
                            icon: pinImage
                        });

                        markersArray.push(meMarker);

                        // reload
                        // reload data obj
                        var currentLocation = {
                            "Token": token,
                            "Coord": {
                                "lng": currentLng,
                                "lat": currentLat
                            }
                        };

                        pinService.reload().refresh(currentLocation,
                            function (data) {
                                // data: nearBy 20 pins (include unreadable)
                                if (data.length > 0) {
                                    angular.forEach(data, function (pin) {
                                        addMarker(pin);
                                    });

                                    $scope.map.setCenter(bounds.getCenter());
                                    $scope.map.fitBounds(bounds);
                                    $scope.map.setZoom(map.getZoom());
                                }

                                //$ionicLoading.hide();
                                pinService.hideloading();
                            },
                            function (error) {
                                // failed to load api
                                //$ionicLoading.hide();
                                pinService.hideloading();
                            });
                    }

                    // add markers (pin)
                    function addMarker(pin) {
                        var readPinColor = PinColor.success;
                        var readPinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + readPinColor,
                           null, /* size is determined at runtime */
                           null, /* origin is 0,0 */
                           null, /* anchor is bottom center of the scaled image */
                           new google.maps.Size(31.5, 51)
                       );

                        var markerLatLng = setPosition(pin.Latitude, pin.Longitude);
                        bounds.extend(markerLatLng);

                        //var tipHtml = "<h5>Pin Piece:</h5> User:" + pin.UserId + "<h5>Token:" + pin.Token + "</h5><br/>What been told: " + pin.Text;
                        //if (pin.Distance) {
                        //    if (pin.IsReadable)
                        //        tipHtml += "<h4>Readable</h4>";
                        //    else {
                        //        tipHtml += "<h4>Too far away</h4><h5>distance: " + pin.Distance + " M</h5>";
                        //    }
                        //}

                        if (pin.IsReadable) {
                            var marker = new google.maps.Marker({
                                position: markerLatLng,
                                map: map,
                                title: pin.Token,
                                icon: readPinImage
                                //infowindow: infowindow
                            });
                        } else {
                            var marker = new google.maps.Marker({
                                position: markerLatLng,
                                map: map,
                                title: pin.Token
                                //infowindow: infowindow
                            });
                        }

                        google.maps.event.addListener(marker, 'click', function () {
                            pinService.loading(); // spin loading
                            pinService.pinSvc().get({ pinId: pin.Id },
                                function (pinData) {
                                    pinService.hideloading();
                                    $scope.pinDetail = pinData;
                                    if (pinData.Id != null) {
                                        //alert(pinData.Text);
                                        openPinDetailsModal();
                                    }
                                    else {
                                        //alert("Pin info not in mysql");
                                        openPinDetailsModal();
                                    }
                                }, function (error) {
                                    //log the error
                                    pinService.hideloading();
                                });

                            //this.infowindow.setContent(tipHtml);
                            //this.infowindow.open(map, this);
                        });

                        markersArray.push(marker);
                    }

                }

                function setMapOnAll(map) {
                    for (var i = 0; i < markersArray.length; i++) {
                        markersArray[i].setMap(map);
                    }
                }

                function deleteMarkers() {
                    setMapOnAll(null);
                    markersArray = [];
                }

                function setPosition(lat, lng) {
                    return new google.maps.LatLng(lat, lng);
                }

                function takeImage() {
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

                function chooseImage() {
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

                function openNewPinModal() {
                    //$scope.map.setClickable(false);
                    $scope.newPinModal.show();
                }

                function closeNewPinModal() {
                    //$scope.map.setClickable(true);
                    $scope.newPinModal.hide();
                }

                function openPinDetailsModal() {
                    //$scope.map.setClickable(true);
                    $scope.pinDetailsModal.show();
                }

                function closePinDetailsModal() {
                    //$scope.map.setClickable(true);
                    $scope.pinDetailsModal.hide();
                }

                function postNewPin(newpin) {

                    var pin = {
                        "Token": token,
                        "Longitude": currentLng,
                        "Latitude": currentLat,
                        "Text": newpin.message,
                        "IsPrivate": newpin.isPrivate
                    };

                    pinService.pinSvc().save(pin,
                        function (data) {
                            // new pin stored in mysql and mongo
                            $scope.newPinModal.hide();
                            //$scope.map.setClickable(true);
                            //PinLoad();
                        }, function (error) {
                            // error handle
                        });

                }

                function postNewComment(commentObj) {
                    var comment = {
                        "Token": token,
                        "Comment": commentObj.message,
                        "Latitude": currentLat,
                        "Longitude": currentLng
                    };

                    pinService.commentSvc().save({ pinId: $scope.pinDetail.Id }, comment,
                        function (data) {
                            //what happens once submit comment
                        },
                        function (error) { });
                }

                // initial
                tokenLoad(); // set the device unique token
                locationLoad();
 
            });

            // register modal templates
            $ionicModal.fromTemplateUrl('post-new-pin.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.newPinModal = modal;
            });

            $ionicModal.fromTemplateUrl('load-details-pin.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.pinDetailsModal = modal;
            });

        }]);
})();