(function () {
    'use strict';

    app.service('pinService', ['$resource', '$ionicLoading', 'endpoint', 'pagination',
        function ($resource, $ionicLoading, endpoint, pagination) {

            //var useEndpoint = endpoint.LiveAPI;
            var useEndpoint = endpoint.LocalAPI;

            var service = {
                reload: reload,

                pinSvc: pinSvc,
                commentSvc: commentSvc,

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