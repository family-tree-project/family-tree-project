require('angular/angular');
require('angular-route');
require('angular-base64');
require('leaflet');
require('angular-simple-logger');
require('ui-leaflet');
var angular = window.angular;

var familyTreeApp = angular.module('FamilyTreeApp', ['ngRoute', 'base64', require('angular-cookies'), 'nemLogging', 'ui-leaflet']);
require('./familytree/familytree')(familyTreeApp);
require('./users/users.js')(familyTreeApp);

familyTreeApp.config(['$routeProvider', function($route) {
  $route
  .when('/familyTrees', {
    templateUrl: '/templates/familyTree_view.html',
    controller: 'FamilyTreeController'
  })
  .when('/signup', {
    templateUrl: '/templates/users/views/signupin_view.html',
    controller: 'SignupController'
  })
  .when('/signin', {
    templateUrl: '/templates/users/views/signupin_view.html',
    controller: 'SigninController'
  })
  .otherwise({
    redirectTo: '/signup'
  });
}]);
