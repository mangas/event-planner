'use strict';

// Declare app level module which depends on views, and components
angular.module('EventPlanner', [
        'ngRoute',
        'EventPlanner.users',
        'EventPlanner.events',
        'ngMaterial',
        'ngMessages',
        'ngMaterialDatePicker'
    ])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/users'});

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
    })