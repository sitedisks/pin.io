(function () {
    'use strict';
    app.controller('HomeCtrl', ['$rootScope', '$scope', '$stateParams', '$cordovaDevice', '$cordovaGeolocation', '$cordovaCamera', '$ionicPopup', '$ionicPlatform', '$ionicModal', 'pinService', 'PinColor', 'defaultLocation', 'pagination', 's3Image',
        function ($rootScope, $scope, $stateParams, $cordovaDevice, $cordovaGeolocation, $cordovaCamera, $ionicPopup, $ionicPlatform, $ionicModal, pinService, PinColor, defaultLocation, pagination, s3Image) {

            var token;
            var map;
            var mapDiv = document.getElementById("map");
            var currentLat = defaultLocation.lat;
            var currentLng = defaultLocation.lng;
            var markersArray = [];
            var commentPage = 1;
            var commentTotal = -1;

            // 1> device ready
            $ionicPlatform.ready(function () {

                scopeVariables();

                $scope.locationLoad = locationLoad;
                $scope.takeImage = takeImage;
                $scope.chooseImage = chooseImage;
                $scope.openNewPinModal = openNewPinModal;
                $scope.closeNewPinModal = closeNewPinModal;
                $scope.openPinDetailsModal = openPinDetailsModal;
                $scope.closePinDetailsModal = closePinDetailsModal;
                $scope.postNewPin = postNewPin;
                $scope.postNewComment = postNewComment;
                $scope.refreshComments = refreshComments;
                $scope.loadComments = loadComments;
                $scope.moreCommentsCanBeLoaded = moreCommentsCanBeLoaded;

                // implement functions
                function locationLoad() {

                    //deleteMarkers();

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
 
                        MapLoad();
                    });
                }

                function takeImage() {
                    var options = {
                        quality: 100,
                        destinationType: Camera.DestinationType.FILE_URI,
                        sourceType: Camera.PictureSourceType.CAMERA,
                        allowEdit: true,
                        encodingType: Camera.EncodingType.JPEG,
                        targetWidth: 350,
                        targetHeight: 350,
                        popoverOptions: CameraPopoverOptions,
                        saveToPhotoAlbum: false
                    };

                    $cordovaCamera.getPicture(options).then(function (imageData) {
                        $scope.srcImage = imageData;
                    }, function (err) {
                        // error
                    });
                }

                function chooseImage() {
                    var options = {
                        quality: 100,
                        destinationType: Camera.DestinationType.FILE_URI,
                        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                        allowEdit: true,
                        encodingType: Camera.EncodingType.JPEG,
                        targetWidth: 350,
                        targetHeight: 350,
                        popoverOptions: CameraPopoverOptions,
                        saveToPhotoAlbum: false
                    };

                    $cordovaCamera.getPicture(options).then(function (imageData) {
                        $scope.srcImage = imageData;
                    }, function (err) {
                        // error
                    });

                    //$cordovaCamera.cleanup().then(); // only for FILE_URI
                }

                function openNewPinModal() {
                    $scope.map.setClickable(false);
                    $scope.newPinModal.show();
                }

                function closeNewPinModal() {
                    $scope.map.setClickable(true);
                    $scope.newPinModal.hide();
                    //$scope.newPinModal.remove();
                }

                function openPinDetailsModal() {
                    $scope.map.setClickable(true);
                    $scope.pinDetailsModal.show();
                }

                function closePinDetailsModal() {
                    $scope.map.setClickable(true);
                    $scope.pinDetailsModal.hide();
                    //$scope.pinDetailsModal.remove();
                }

                function postNewPin() {
                    // upload the image first return GUID 
                    uploadImageS3();
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
                            // refresh the comment list
                        },
                        function (error) { });
                }

                function refreshComments() {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Refresh',
                        template: 'Comments refreshed'
                    });
                    $scope.$broadcast('scroll.refreshComplete');
                }

                function loadComments() {
                    if ($scope.pinDetail) {
                        pinService.commentSvc(commentPage).get({ pinId: $scope.pinDetail.Id },
                            function (data) {
                                commentTotal = data.total;
                                var list = data.list;

                                angular.forEach(list, function (item) {
                                    $scope.pinComments.push(item);
                                });
                                commentPage++;

                                $scope.$broadcast('scroll.infiniteScrollComplete');
                            }, function (error) {

                                errorHandler();
                            });
                    }

                }

                function moreCommentsCanBeLoaded() {
                    if (commentTotal == -1)
                        return true;
                    if ($scope.pinComments.length < commentTotal)
                        return true;
                    return false;
                }


                // helper function
                function tokenLoad() {
                    try {
                        token = $cordovaDevice.getUUID();
                        pinService.storageSet('deviceToken', token);
                    }
                    catch (err) {
                        console.log("Error " + err.message);
                    }
                    finally {
                        token = 'not-real-device-test-only';
                    }
                }

                function MapLoad() {
                    /* native google map */
                    map = plugin.google.maps.Map.getMap(mapDiv, {
                        'camera': {
                            'latLng': setNativePosition(currentLat, currentLng),
                            'zoom': 12
                        }
                    });

                    map.clear(); // native only?
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
                            marker.on('click', function () {
                                alert(marker.get('marker').title);
                            });
                        });

                        markersArray.push(currentMarker);

                        var currentLocation = {
                            "Token": token,
                            "Coord": {
                                "lng": currentLng,
                                "lat": currentLat
                            }
                        };

                        // reload
                        pinService.reload().refresh(currentLocation,
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
                            marker.on('click', function () {
                                pinService.loading(); // spin loading
                                // api load pin details
                                pinService.pinSvc().get({ pinId: pin.Id },
                                    function (pinData) {
                                        pinService.hideloading();
                                        if (!pinData.ImageUri)
                                            pinData.ImageUri = "83f25ab2-f676-4def-87a6-67efc93b1f05"; // default image (Todo: should load from server random
                                        pinData.ImageUrl = s3Image.dev + pinData.ImageUri;

                                        $scope.pinDetail = pinData;

                                        if (pinData.Id != null) {
                                            // get all comments for this PIN
                                            loadComments(commentPage, $scope.pinDetail.Id);
                                            openPinDetailsModal();
                                        }
                                        else {
                                            errorHandler();
                                        }
                                    }, function (error) {
                                        //log the error
                                        pinService.hideloading();
                                    });
                            });
                        });

                        markersArray.push(marker);
                    }
                }

                function errorHandler() {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Unknow Error',
                        template: 'Please reload the app try again'
                    });
                }

                function setNativePosition(lat, lng) {
                    return new plugin.google.maps.LatLng(lat, lng);
                }

                function uploadImageS3() {
                    pinService.loading(); // spin loading
                    // upload image to s3
                    if ($scope.srcImage != null) {
                        pinService.imageUploadSvc($scope.srcImage)
                            .then(function (result) {
                                $scope.returnImgaeGUID = result.response.replace(/^"(.*)"$/, '$1');
                                uploadPin();
                            }, function (err) {
                                console.log('Error status: ' + JSON.stringify(err));
                            }, function (progress) {
                                // PROGRESS HANDLING GOES HERE
                            });
                    } else {
                        uploadPin();
                    }

                }

                function uploadPin() {
                    var pin = {
                        "Token": token,
                        "Longitude": currentLng,
                        "Latitude": currentLat,
                        "Text": $scope.newPin.message,
                        "IsPrivate": $scope.newPin.isPrivate,
                        "ImageUri": $scope.returnImgaeGUID
                    };

                    pinService.pinSvc().save(pin,
                        function (data) {
                            // new pin stored in mysql and mongo
                            pinService.hideloading();
                            $scope.newPinModal.hide();
                            $scope.map.setClickable(true);
                            //PinLoad();
                        }, function (error) {
                            pinService.hideloading();
                            // error handle
                        });
                }

                // initial
                tokenLoad(); // set the device unique token
                locationLoad();

            });

            function scopeVariables() {
                $scope.pinDetail = null;
                $scope.pinComments = [];
                $scope.newPin = { message: '', isPrivate: false };
                $scope.srcImage = null;
                $scope.returnImgaeGUID = null;
            }

            // Cleanup the modal when we're done with it
            $scope.$on('$destroy', function () {
                var alertPopup = $ionicPopup.alert({
                    title: 'destroy',
                    template: 'general destroy'
                });

            });
            // Execute action on hide modal
            $scope.$on('modal.hidden', function () {

                // clean up scope variables
                scopeVariables();
                commentPage = 1;
                commentTotal = -1;
                //var alertPopup = $ionicPopup.alert({
                //    title: 'hidden',
                //    template: 'general hidden'
                //});

            });
            // Execute action on remove modal
            $scope.$on('modal.removed', function () {
                var alertPopup = $ionicPopup.alert({
                    title: 'removed',
                    template: 'general removed'
                });
            });

            // register modal templates
            $ionicModal.fromTemplateUrl('templates/_pinNew.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.newPinModal = modal;
            });

            $ionicModal.fromTemplateUrl('templates/_pinDetails.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.pinDetailsModal = modal;
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