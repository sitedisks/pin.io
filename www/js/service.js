(function () {
    'use strict';

    app.service('pinService', ['$resource', '$ionicLoading', 'endpoint',
        function ($resource, $ionicLoading, endpoint) {

            //var useEndpoint = endpoint.LiveAPI;
            var useEndpoint = endpoint.LocalAPI;

            var service = {
                reload: reload,
                postPin: postPin,
                loadPin: loadPin,
                loading: loading,
                hideloading: hideloading
            };

            return service;

            function reload() {
                return $resource(useEndpoint + '/pins/reload', {},
                    { 'save': { method: 'POST', isArray: true } }
                );
            }

            function postPin() {
                return $resource(useEndpoint + '/pins');
            }

            function loadPin() {
                return $resource(useEndpoint + '/pins/details?pinId=:pinId', { pinId: '@id' });
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