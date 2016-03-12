'use strict';

// Declare app level module which depends on views, and components
angular.module('EventPlanner', [
        'ngRoute',
        'EventPlanner.users',
        'EventPlanner.events',
        'ngMaterial',
        'ngMessages',
        'mdPickers'
    ])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/users'});

    }])

    .directive('focusThis', [ '$timeout', function($timeout){
        return {
            link: function(scope, element, attrs) {
                scope.$watch(attrs.focusThis, function() {
                    $timeout(function() {
                        console.debug('Focusing '+element[0].id);
                        angular.element(element[0]).focus();
                    // Seems that without this delay the focus is stolen
                    }, 100);
                });
            }
        }
    }])

    .controller('appCtrl', ['$scope', '$mdSidenav', '$mdToast', function ($scope, $mdSidenav, $mdToast) {

        $scope.storageSupported = !!window.localStorage;

        $scope.toggle = function () {
            var navbar = $mdSidenav('sidenav');
            if (!navbar.isLockedOpen())
                navbar.toggle();
        };

        $scope.clearStorage = function () {
            if (window.localStorage)
                window.localStorage.clear();
        };

        $scope.openToast = function () {
            $mdToast.show({
                controller: 'ToastCtrl',
                templateUrl: 'refreshtoast.html',
                hideDelay: 6000,
                position: 'bottom'
            });
        };
    }])
    .controller('ToastCtrl', function ($scope, $mdToast, $route) {
        $scope.closeToast = function () {
            $mdToast.hide();
        };
        $scope.refresh = function () {
            location.reload(true);
        }
    });