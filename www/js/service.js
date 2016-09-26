(function () {
    'use strict';

    app.service('pinService', ['$resource', '$ionicLoading', '$cordovaFileTransfer', 'localStorageService', 'Upload', 'endpoint', 'pagination',
        function ($resource, $ionicLoading, $cordovaFileTransfer, localStorageService, Upload, endpoint, pagination) {

            var useEndpoint = endpoint.LiveAPI;
            //var useEndpoint = endpoint.LocalAPI;

            var service = {
                reload: reload,

                pinSvc: pinSvc,
                commentSvc: commentSvc,

                fileUploadSvc: fileUploadSvc,
                imageUploadSvc: imageUploadSvc,

                storageSet: storageSet,
                storageGet: storageGet,

                loading: loading,
                hideloading: hideloading
            };

            return service;

            function reload() {
                return $resource(useEndpoint + '/location/reload', {},
                    { 'refresh': { method: 'POST', isArray: true } }
                );
            }

            function pinSvc() {
                return $resource(useEndpoint + '/pins/:pinId', { pinId: '@pid' });
            }

            function commentSvc(page) {
                var pagedComments = '/pins/:pinId/comments';
                if (page)
                    pagedComments += '?page=' + page + '&row=' + pagination.row;

                return $resource(useEndpoint + pagedComments, { pinId: '@pid' });
            }

            function fileUploadSvc(file) {
                return Upload.upload({
                    url: useEndpoint + '/pins/s3Image',
                    method: 'POST',
                    data: { file: file, 'directory': 'upload', 'fileName': 'TestImage', 'UserName': 'testesttest' }
                });
            }

            function imageUploadSvc(imageSource) {
                var options = {
                    fileKey: "file",
                    fileName: "pin-image",
                    chunkedMode: false,
                    mimeType: "image/jpg",
                    params: { 'directory': 'upload', 'fileName': "pin-image" }
                };
                var imageServer = '/pins/s3Image';
                return $cordovaFileTransfer.upload(useEndpoint + imageServer, imageSource, options);
            }

            function storageSet(key, val) {
                return localStorageService.set(key, val);
            }

            function storageGet(key) {
                return localStorageService.get(key);
            }

            function loading() {
                $ionicLoading.show({
                    template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
                });
            }

            function hideloading() {
                $ionicLoading.hide();
            }
        }]);

})();