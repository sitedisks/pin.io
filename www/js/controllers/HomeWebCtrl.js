(function () {
    'use strict';
    app.controller('HomeWebCtrl', ['$rootScope', '$scope', '$stateParams', '$cordovaDevice', '$cordovaGeolocation', '$cordovaCamera', '$cordovaFileTransfer', '$ionicPopup', '$ionicPlatform', '$ionicModal', 'pinService', 'PinColor', 'defaultLocation', 'pagination', 'endpoint',
        function ($rootScope, $scope, $stateParams, $cordovaDevice, $cordovaGeolocation, $cordovaCamera, $cordovaFileTransfer, $ionicPopup, $ionicPlatform, $ionicModal, pinService, PinColor, defaultLocation, pagination, endpoint) {

            var useEndpoint = endpoint.LiveAPI;
            //var useEndpoint = endpoint.LocalAPI;

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
                        quality: 80,
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
                        //$scope.srcImage = "data:image/jpeg;base64," + imageData;
                        $scope.srcImage = imageData;
                        $scope.picData = imageData;
                        $scope.ftLoad = true;

                        var options = {
                            fileKey: "file",
                            fileName: "TestImage",
                            chunkedMode: false, // ?
                            mimeType: "image/jpg",
                            params: { 'directory': 'upload', 'fileName': "TestImage" } // directory represents remote directory,  fileName represents final remote file name
                        };

                        //$cordovaFileTransfer.upload(useEndpoint + '/pins/image', $scope.srcImage, options).then(onSuccess, onError, onProgress);
                        // https://www.thepolyglotdeveloper.com/2015/01/upload-files-remote-server-using-ionic-framework/
                        // http://www.gajotres.net/using-cordova-file-transfer-plugin-with-ionic-framework/2/

                        $cordovaFileTransfer.upload(useEndpoint + '/pins/image', $scope.srcImage, options).then(function (result) {
                            alert("SUCCESS: " + JSON.stringify(result.response));
                        }, function (err) {
                            alert("ERROR: " + JSON.stringify(err));
                        }, function (progress) {
                            // PROGRESS HANDLING GOES HERE
                        });

                    }, function (err) {
                        // error
                    });
                }

                function chooseImage() {
                    var options = {
                        quality: 80,
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
                        $scope.srcImage = "data:image/jpeg;base64," + imageData;
                        $scope.srcImage = imageData;
                        $scope.picData = imageData;
                        $scope.ftLoad = true;

                        //window.resolveLocalFileSystemURI(imageData, function (fileEntry) {
                        //    $scope.srcImage = fileEntry.nativeURL;
                        //    $scope.picData = fileEntry.nativeURL;
                        //    $scope.ftLoad = true;
                        //});
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
                    alert($scope.picData);
                }

                // initial
                tokenLoad(); // set the device unique token
                locationLoad();

            });

            function scopeVariables() {
                $scope.pinDetail = null;
                $scope.pinComments = [];
                $scope.newPin = { message: '', isPrivate: false };
                $scope.picData = null;
                $scope.ftLoad = false;
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