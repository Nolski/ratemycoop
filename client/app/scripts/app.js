'use strict';

/**
 * @ngdoc overview
 * @name ratemycoopApp
 * @description
 * # ratemycoopApp
 *
 * Main module of the application.
 */
angular
  .module('ratemycoopApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'angular.filter',
    'lbServices',
    'mgo-angular-wizard',
    'btford.markdown'
  ])
  .config(['$routeProvider', '$locationProvider', 'LoopBackResourceProvider', '$httpProvider', function ($routeProvider, $locationProvider, LoopBackResourceProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/company/:companyname', {
        templateUrl: 'views/company.html',
        controller: 'CompanyCtrl'
      })
      .when('/company/:companyname/review', {
        templateUrl: 'views/reviewform.html',
        controller: 'ReviewformCtrl'
      })
      .when('/privacy', {
        templateUrl: 'views/privacy.html',
        controller: 'PrivacyCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

    //$locationProvider.html5Mode({ enabled: true, requireBase: false });

    // Set url base
    LoopBackResourceProvider.setUrlBase('https://ratemycoop.io/api');

    /**
     * Set http interceptor for 40x unauthorized
     */

    $httpProvider.interceptors.push(function ($q, $location) {
      return {
        responseError: function (rejection) {
          if (rejection.status == 401) {
            $location.nextAfterLogin = $location.path();
            $location.path('/404');
          }
          return $q.reject(rejection);
        }
      };
    });
  }]);
