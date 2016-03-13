'use strict';

const LIST_USERS_URL = '/users';
const NEW_USERS_URL = '/users/new';

angular.module('EventPlanner.users', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/users', {
            templateUrl: 'users/users.html',
            controller: 'UsersCtrl'
        });
        $routeProvider.when('/users/new', {
            templateUrl: 'users/newuser.html',
            controller: 'NewUsersCtrl'
        });
        $routeProvider.when('/users/edit/:email', {
            templateUrl: 'users/newuser.html',
            controller: 'NewUsersCtrl'
        });
    }])
    .factory('userService', [function () {

        var self = this;

        self.LIST_USERS_URL = '#' + LIST_USERS_URL;
        self.NEW_USERS_URL = '#' + NEW_USERS_URL;
        self.USERS_KEY = 'USERS';

        var User = function (firstName, lastName, email, password, details) {
            this.firstName = firstName;
            this.lastName = lastName;
            this.name = this.getName();
            this.email = email;
            this.password = password;
            this.details = details;
        };

        User.fromObject = function (obj) {
            return new User(
                obj.firstName,
                obj.lastName,
                obj.email,
                obj.password,
                obj.details
            );
        };

        self.User = User;

        User.prototype.getName = function () {
            return this.firstName + ' ' + this.lastName;
        };

        User.prototype.updateFromUser = function (user) {
            this.firstName = user.firstName;
            this.lastName = user.lastName;
            this.name = this.getName();
            this.email = user.email;
            this.details = user.details;
        };

        User.formats = {
            date: "DD/MM/YYYY"
        };

        User.prototype.getBirthdayString = function () {
            if (this.details.birthday)
                return moment(this.details.birthday).format(User.formats.date)
        };

        //User Storage
        self.storage = window.localStorage;

        if (self.storage) {
            if (self.storage.key(self.USERS_KEY)) {
                var jsonusers = JSON.parse(self.storage.getItem(self.USERS_KEY));
                if (jsonusers)
                    self.users = jsonusers.map(function (obj) {
                        return User.fromObject(obj);
                    });
            }

        } else
            console.warn('No localStorage available');

        if (!self.users)
            self.users = [
                // Shamfully copied from Angular Material Example
                new User("Narayana", "Garner", "n.garner@example.com"),
                new User("Anita", "Gros", "a.gros@example.com"),
                new User("Some-guy", "withalongalastaname", "s.withalongalastaname@example.com")
            ];


        self.updateUsers = function () {
            if (self.storage)
                self.storage.setItem(self.USERS_KEY, JSON.stringify(self.users));
        };

        self.getAllUsers = function () {
            return self.users;
        };

        self.getUserByEmail = function (email) {
            return self.users.find(function (usr) {
                return usr.email === email
            });
        };

        self.addUser = function (user) {
            self.users.push(user);
            self.updateUsers();
        };

        self.removeUser = function (email) {
            var index = self.users.findIndex(function (usr) {
                return usr.email === email;
            });
            if (index != -1) {
                self.users.splice(index, 1);
                self.updateUsers();
            }
        };

        return self;

    }])

    .controller('UsersCtrl', ['$scope', 'userService', function ($scope, userService) {

        $scope.users = userService.users;
        $scope.deleteUser = userService.removeUser;

    }])

    .controller('NewUsersCtrl', ['$scope', 'userService', '$window', '$routeParams', function ($scope, userService, $window, $routeParams) {

        $scope.isEdit = function () {
            return !!$routeParams.email
        };

        if ($scope.isEdit()) {
            var formUser = userService.getUserByEmail($routeParams.email);
            if (formUser) {
                $scope.user = angular.copy(formUser);
                if (formUser.details && formUser.details.birthday)
                    $scope.user.details.birthday = moment(formUser.details.birthday).toDate();
            }

            else
            // Trying to edit a non-existent user
                $window.location.href = userService.LIST_USERS_URL
        }
        else
            $scope.user = null;

        $scope.formats = userService.User.formats;

        $scope.verifyPassword = function () {

            var firstPassword = $scope.userForm.password.$viewValue || "";
            var secondPassword = $scope.userForm.cpassword.$viewValue || "";

            function match(pattern) {
                var constraint = new RegExp(pattern);
                var res = constraint.test(firstPassword);
                return res;
            }

            var constraints = {
                'match': function () {
                    return firstPassword == secondPassword && firstPassword && secondPassword;
                },
                'minLength': function () {
                    return firstPassword.length >= 6;
                },
                'maxLength': function () {
                    return firstPassword.length <= 100;
                },
                'symbol': function () {
                    return match("[\!\@\#\$\%\^\&\*]");
                },
                'number': function () {
                    return match("[0-9]");
                },
                'lowercase': function () {
                    return match("[a-z]");
                },
                'uppercase': function () {
                    return match("[A-Z]");
                }
            };

            var checkPassword = function () {
                var messages = Object.keys(constraints).map(function (key) {
                    if (constraints[key]())
                        return "";
                    else
                        return key;
                }).filter(function (msg) {
                    return msg !== ""
                });

                return messages;
            };


            var setValidity = function (checks, value) {
                checks.forEach(function (ctr) {
                    if (ctr === 'match')
                        $scope.userForm.cpassword.$setValidity(ctr, value);
                    else
                        $scope.userForm.password.$setValidity(ctr, value);
                });
            };


            var res = checkPassword();
            if (res.length === 0)
                setValidity(Object.keys(constraints));
            else {
                var trues = Object.keys(constraints).filter(function (ctr) {
                    return !res.includes(ctr);
                });
                setValidity(trues, true);
                setValidity(res, false);
            }

        };

        $scope.submitForm = function () {

            if ($scope.isEdit()) {
                var usr = angular.copy($scope.user);
                if (usr.details && usr.details.birthday)
                    usr.details.birthday = usr.details.birthday.getTime();
                userService.getUserByEmail($routeParams.email).updateFromUser(usr);
                userService.updateUsers();
            }

            else {
                var sha1password = new Hashes.SHA1().hex($scope.user.password);
                userService.addUser(new userService.User(
                    $scope.user.firstName,
                    $scope.user.lastName,
                    $scope.user.email,
                    sha1password
                ));
            }

            $window.location.href = userService.LIST_USERS_URL
        }


    }]);

