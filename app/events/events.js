'use strict';

const LIST_EVENTS_URL = '/events';
const NEW_EVENT_URL = '/events/new';

angular.module('EventPlanner.events', ['ngRoute', 'ngMaterial', 'ngMessages'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/events', {
            templateUrl: 'events/events.html',
            controller: 'EventsCtrl'
        });
        $routeProvider.when('/events/new', {
            templateUrl: 'events/newevent.html',
            controller: 'NewEventsCtrl'
        });
        $routeProvider.when('/events/edit/:id', {
            templateUrl: 'events/newevent.html',
            controller: 'NewEventsCtrl'
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

        var Event = function (eventName, eventType, eventHost, dateTimeStart, dateTimeEnd, guests, location, message) {
            Event.id = Event.id || 0;
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

        self.getIdAndIncrement = function () {
            var id = self.latest_id++;
            if (self.storage)
                self.storage.setItem(self.EVENT_ID_KEY, self.latest_id);
            return id;
        };

        Event.formats = {
            time: "HH:MM Z",
            date: "DD/MM/YYYY"
        };

        Event.eventTypes = ['Birthday Party', 'Conference Talk', 'Wedding'];

        Event.fromObject = function (obj) {
            return new Event(
                obj.name,
                obj.type,
                obj.host,
                obj.dateTimeStart,
                obj.dateTimeEnd,
                obj.guests,
                obj.location,
                obj.message
            );
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

        Event.prototype.getStartDateString = function () {
            return moment(this.dateTimeStart).format(Event.formats.date + ' ' + Event.formats.time)
        };

        Event.prototype.getEndDateString = function () {
            return moment(this.dateTimeEnd).format(Event.formats.date + ' ' + Event.formats.time)
        };

        if (self.storage) {

            if (self.storage.key(self.EVENT_ID_KEY))
                self.latest_id = JSON.parse(self.storage.getItem(self.EVENT_ID_KEY));
            else
                self.latest_id = 0;

            if (self.storage.key(self.EVENTS_KEY)) {
                var jsonEvents = JSON.parse(self.storage.getItem(self.EVENTS_KEY));

                if (jsonEvents)
                    self.events = jsonEvents.map(function (event) {
                        return new Event.fromObject(event);
                    });
            }
            ;
        } else
            console.warn('No localStorage available');


        if (!self.events)
            self.events = [
                new Event(
                    "Another event",
                    'Another Type',
                    "AnHost",
                    new Date('2016-03-06T15:35:00.991Z').getTime(),
                    new Date('2016-03-06T15:40:00.300Z').getTime(),
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
                    new Date('2016-03-06T15:35:00.991Z').getTime(),
                    new Date('2016-03-06T15:40:00.300Z').getTime(),
                    [],
                    {
                        address1: "There",
                        city: "London",
                        postalCode: "S10"
                    },
                    'Yes please'
                )
            ];

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

    .controller('EventsCtrl', ['$scope', 'eventService', function ($scope, eventService) {

        $scope.events = eventService.events;
        $scope.deleteEvent = eventService.removeEvent;
    }])

    .controller('NewEventsCtrl', ['$scope', 'eventService', '$window', '$routeParams', function ($scope, eventService, $window, $routeParams) {

        $scope.formats = eventService.Event.formats;

        $scope.isEdit = function () {
            return !!$routeParams.id;
        };

        if ($scope.isEdit()) {
            var formEvent = eventService.getEventById($routeParams.id);
            if (formEvent) {
                $scope.event = angular.copy(formEvent);
                $scope.event.dateStart = new Date(moment(formEvent.dateTimeStart).format(eventService.Event.formats.date));
                $scope.event.timeStart = new Date(moment(formEvent.dateTimeStart).format(eventService.Event.formats.date + ' ' + eventService.Event.formats.time));
                $scope.event.dateEnd = new Date(moment(formEvent.dateTimeEnd).format(eventService.Event.formats.date));
                $scope.event.timeEnd = new Date(moment(formEvent.dateTimeEnd).format(eventService.Event.formats.date + ' ' + eventService.Event.formats.time));
            }

            else
            // Trying to edit a non-existent Event
                $window.location.href = eventService.LIST_EVENTS_URL
        }
        else
            $scope.event = null;


        $scope.eventTypes = eventService.Event.eventTypes;

        var getStartDate = function () {
            var dateStart = angular.copy($scope.event.dateStart);
            var timeStart = angular.copy($scope.event.timeStart);

            dateStart.setHours(timeStart.getHours());
            dateStart.setMinutes(timeStart.getMinutes());

            return dateStart;
        };

        var getEndDate = function () {
            var dateEnd = angular.copy($scope.event.dateEnd);
            var timeEnd = angular.copy($scope.event.timeEnd);

            dateEnd.setHours(timeEnd.getHours());
            dateEnd.setMinutes(timeEnd.getMinutes());

            return dateEnd;
        }

        $scope.verifyDates = function () {
            var dateStart = $scope.event.dateStart;
            var timeStart = $scope.event.timeStart;
            var dateEnd = $scope.event.dateEnd;
            var timeEnd = $scope.event.timeEnd;

            if (!(dateStart && dateEnd && timeStart && timeEnd))
                return;

            var startMoment = moment(getStartDate().getTime());
            var endMoment = moment(getEndDate().getTime());

            $scope.eventForm.endtime.$setValidity('startvalid', startMoment.isValid());
            $scope.eventForm.endtime.$setValidity('endvalid', endMoment.isValid());
            var endAfterStart = startMoment.isValid() && endMoment.isValid() && endMoment.isAfter(startMoment);
            $scope.eventForm.endtime.$setValidity('after', endAfterStart)

            return endAfterStart;
        };

        $scope.submitForm = function () {
            if (!$scope.verifyDates())
                return;

            var event = new eventService.Event(
                $scope.event.name,
                $scope.event.type,
                $scope.event.host,
                getStartDate().getTime(),
                getEndDate().getTime(),
                [],
                $scope.event.location,
                $scope.event.message
            );

            if ($scope.isEdit()) {
                eventService.getEventById($routeParams.id).updateFromEvent(event);
                eventService.updateEvents();
            }
            else {
                eventService.addEvent(event);
            }

            $window.location.href = eventService.LIST_EVENTS_URL
        };

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