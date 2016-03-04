'use strict';

const LIST_EVENTS_URL = '/events';
const NEW_EVENT_URL = '/events/new';

angular.module('EventPlanner.events', ['ngRoute', 'ngMaterial', 'ngMessages'])

    .config(['$routeProvider', '$mdThemingProvider', function ($routeProvider, $mdThemingProvider) {
        $routeProvider.when('/events', {
            templateUrl: 'events/events.html',
            controller: 'EventsCtrl'
        });
        $routeProvider.when('/events/new', {
            templateUrl: 'events/newevent.html',
            controller: 'EventsCtrl'
        });
        $routeProvider.when('/events/edit/:id', {
            templateUrl: 'events/newevent.html',
            controller: 'EventsCtrl'
        });
        $routeProvider.when('/events/guests/:id', {
            templateUrl: 'events/guests.html',
            controller: 'GuestsCtrl'
        });
    }])

    .factory('eventService', [function () {

        var self = this;

        var injector = angular.injector(['ng', 'EventPlanner.users']);
        self.userService = injector.get('userService');

        self.storage = window.localStorage;

        self.LIST_EVENTS_URL = '#' + LIST_EVENTS_URL;
        self.NEW_EVENT_URL = '#' + NEW_EVENT_URL;
        self.EVENTS_KEY = 'EVENTS';
        self.EVENT_ID_KEY = 'EVENT_ID';

        if (self.storage) {
            if (self.storage.key(self.EVENTS_KEY))
                self.events = JSON.parse(self.storage.getItem(self.EVENTS_KEY));
            if (self.storage.key(self.EVENT_ID_KEY))
                self.latest_id = JSON.parse(self.storage.getItem(self.EVENT_ID_KEY));
            else
                self.latest_id = 0;
        } else
            console.warn('No localStorage available');

        var Event = function (eventName, eventType, eventHost, dateTimeStart, dateTimeEnd, guests, location, message) {
            Event.id = Event.id || 0
            this.id = self.getIdAndIncrement();
            this.name = eventName;
            this.type = eventType;
            this.host = eventHost;
            this.dateTimeStart = dateTimeStart;
            this.dateTimeEnd = dateTimeEnd;
            this.guests = guests;
            this.location = location;
            this.message = message;
        };
        self.Event = Event;

        self.getIdAndIncrement = function() {
            var id = self.latest_id++;
            if (self.storage)
                self.storage.setItem(self.EVENT_ID_KEY, self.latest_id);
            return id;
        };

        Event.prototype.updateFromEvent = function (event) {
            this.name = event.name;
            this.type = event.type;
            this.host = event.host;
            this.dateTimeStart = event.dateTimeStart;
            this.dateTimeEnd = event.dateTimeEnd;
            this.guests = event.guests;
            this.location = event.location;
            this.message = event.message;
        };


        if (!self.events)
            self.events = [
                new Event(
                    "Another event",
                    'Another Type',
                    "AnHost",
                    new Date('2016-03-06T15:35:00.991Z'),
                    new Date('2016-03-06T15:40:00.300Z'),
                    [],
                    {
                        address1: "Here",
                        city: "London",
                        postalCode: "E1"
                    },
                    "Yeah Yeah"
                ),
                new Event(
                    'An Event',
                    'One Type',
                    'Myself',
                    new Date('2016-03-06T15:35:00.991Z'),
                    new Date('2016-03-06T15:40:00.300Z'),
                    [],
                    {
                        address1: "There",
                        city: "London",
                        postalCode: "S10"
                    },
                    'Yes please'
                )
            ];

        Event.eventTypes = ['Birthday Party', 'Conference Talk', 'Wedding'];

        self.addEvent = function (event) {
            self.events.push(event);
            self.updateEvents();
        };

        self.updateEvents = function () {
            if (self.storage)
                self.storage.setItem(self.EVENTS_KEY, JSON.stringify(self.events));
        };

        self.removeEvent = function (event) {
            var index = self.events.findIndex(function (storedEvent) {
                return storedEvent.name === event.name
                    && storedEvent.host === event.host;
            });
            if (index != -1) {
                self.events.splice(index, 1);
                self.updateEvents();
            }
        };

        self.getEventById = function (id) {
            return self.events.find(function (event) {
                return event.id == id;
            });
        };


        return self;
    }])

    .controller('EventsCtrl', ['$scope', 'eventService', '$window', '$routeParams', function ($scope, eventService, $window, $routeParams) {
        $scope.events = eventService.events;
        $scope.deleteEvent = eventService.removeEvent;

        $scope.isEdit = function () {
            return !!$routeParams.id;
        };

        if ($scope.isEdit()) {
            var formEvent = eventService.getEventById($routeParams.id);
            if (formEvent)
                $scope.event = angular.copy(formEvent);
            else
            // Trying to edit a non-existent Event
                $window.location.href = eventService.LIST_EVENTS_URL
        }
        else
            $scope.event = null;

        $scope.eventTypes = eventService.Event.eventTypes;

        $scope.submitForm = function () {
            if ($scope.isEdit()) {
                eventService.getEventById($routeParams.id).updateFromEvent($scope.event);
                eventService.updateEvents();
            }
            else {
                var event = new eventService.Event(
                    $scope.event.name,
                    $scope.event.type,
                    $scope.event.host,
                    $scope.event.dateTimeStart,
                    $scope.event.dateTimeEnd,
                    [],
                    $scope.location,
                    $scope.event.message
                );
                eventService.addEvent(event);
            }

            $window.location.href = eventService.LIST_EVENTS_URL
        }

    }])
    .controller('GuestsCtrl', ['eventService', '$window', '$routeParams', '$scope', function (eventService, $window, $routeParams, $scope) {
        if ($routeParams.id)
            var event = eventService.getEventById($routeParams.id);
        else
            $window.location.href = eventService.LIST_EVENTS_URL;

        $scope.filterSelected = true;
        $scope.users = eventService.userService.getAllUsers();
        $scope.selectedUsers = angular.copy(event.guests);

        $scope.isSelected = function (contact_user) {
            return $scope.selectedUsers.find(function (selected_usr) {
                return contact_user.email === selected_usr.email;
            });
        };

        $scope.addSelected = function (user) {
            $scope.selectedUsers.push(angular.copy(user));
        };

        $scope.querySearch = function (criteria) {
            var lowercaseQuery = angular.lowercase(criteria);
            return $scope.users.filter(function (usr) {
                return usr.email.toLowerCase().indexOf(lowercaseQuery) != -1
                    || usr.getName().toLowerCase().indexOf(lowercaseQuery) != -1;
            });
        };

        $scope.addGuests = function () {
            if ($routeParams.id) {
                var event = eventService.getEventById($routeParams.id);
                if (event) {
                    event.guests = $scope.selectedUsers;
                    eventService.updateEvents();
                }

            }

            $window.location.href = eventService.LIST_EVENTS_URL
        };
    }]);