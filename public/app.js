'use strict'

angular
  .module('benchpressApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'home.template.html',
        controller: 'HomeCtrl',
        controllerAs: 'home'
      })
      .otherwise({
        redirectTo: '/'
      })
  })
