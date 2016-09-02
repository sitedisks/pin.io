(function () {
    'use strict';

    app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

        $stateProvider

		.state('app', {
		    url: '/app',
		    abstract: true,
		    templateUrl: 'templates/menu.html',
		    controller: 'AppCtrl'
		})

		.state('app.home', {
		    url: '/home',
		    views: {
		        'menuContent': {
		            //templateUrl: 'templates/home.html',
		            //controller: 'HomeCtrl'
		            templateUrl: 'templates/homeWeb.html',
                    controller: 'HomeWebCtrl'
		        }
		    }
		})

		.state('app.lists', {
		    url: '/lists',
		    views: {
		        'menuContent': {
		            templateUrl: 'templates/lists.html',
		            controller: 'ListsCtrl'
		        }
		    }
		})

		.state('app.ink', {
		    url: '/ink',
		    views: {
		        'menuContent': {
		            templateUrl: 'templates/ink.html',
		            controller: 'InkCtrl'
		        }
		    }
		})

		.state('app.motion', {
		    url: '/motion',
		    views: {
		        'menuContent': {
		            templateUrl: 'templates/motion.html',
		            controller: 'MotionCtrl'
		        }
		    }
		})

		.state('app.components', {
		    url: '/components',
		    views: {
		        'menuContent': {
		            templateUrl: 'templates/components.html',
		            controller: 'ComponentsCtrl'
		        }
		    }
		})

		.state('app.extensions', {
		    url: '/extensions',
		    views: {
		        'menuContent': {
		            templateUrl: 'templates/extensions.html',
		            controller: 'ExtensionsCtrl'
		        }
		    }
		})
        ;

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/home');
    }]);
})();
