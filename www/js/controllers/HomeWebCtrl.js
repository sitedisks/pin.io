(function () {
    'use strict';
    app.controller('HomeWebCtrl', ['$rootScope', '$scope', '$stateParams', '$cordovaDevice', '$cordovaGeolocation', '$cordovaCamera', '$ionicPopup', '$ionicPlatform', '$ionicModal', 'pinService', 'PinColor', 'defaultLocation', 'pagination', 's3Image',
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
                $scope.moreDataCanBeLoaded = moreDataCanBeLoaded;

                $scope.testCameraFile = testCameraFile;

                $scope.uploadFile = function (file) {
                    pinService.fileUploadSvc(file)
                        .then(function (resp) {
                            console.log('Success [' + resp.config.data.file.name + '] uploaded. Response: ' + resp.data);
                        }, function (resp) {
                            console.log('Error status: ' + resp.status);
                        }, function (evt) {
                            $scope.bannerProgress = parseInt(100.0 * evt.loaded / evt.total);
                            console.log('progress: ' + $scope.bannerProgress + '% ');
                        });
                }


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

                            //this.infowindow.setContent(tipHtml);
                            //this.infowindow.open(map, this);
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

                function uploadPicture() {
                    // read: https://forum.ionicframework.com/t/working-example-to-upload-photo-from-camera-or-galley-with-ngcordova/12852
                }

                function openNewPinModal() {
                    //$scope.map.setClickable(false);
                    $scope.newPinModal.show();
                }

                function closeNewPinModal() {
                    //$scope.map.setClickable(true);
                    $scope.newPinModal.hide();
                    //$scope.newPinModal.remove();
                }

                function openPinDetailsModal() {
                    //$scope.map.setClickable(true);
                    $scope.pinDetailsModal.show();
                }

                function closePinDetailsModal() {
                    //$scope.map.setClickable(true);
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

                function moreDataCanBeLoaded() {
                    if (commentTotal == -1)
                        return true;
                    if ($scope.pinComments.length < commentTotal)
                        return true;
                    return false;
                }

                function testCameraFile() {
                    alert($scope.srcImage);
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
                            //$scope.map.setClickable(true);
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