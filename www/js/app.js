angular.module('ionic.utils', [])
    .factory('$localstorage', ['$window', function ($window) {
        return {
            set: function (key, value) {
                $window.localStorage[key] = value;
            },
            get: function (key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function (key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function (key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        }
}]);

var app = angular.module('starter', ['ionic', 'ngCordova', 'ionic.utils', 'ngResource']);

app.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
});

app.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $sceDelegateProvider, $httpProvider) {
    $ionicConfigProvider.views.transition('none');
    $sceDelegateProvider.resourceUrlWhitelist(['self', 'http://otrs.ap.be/otrs**']);

    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};

    $stateProvider
        .state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/menu.html"
        })
        .state('app.main', {
            url: "/main",
            views: {
                'menuContent': {
                    templateUrl: "templates/main.html",
                    controller: "HomeCtrl"
                }
            }
        })
        .state('app.settings', {
            url: '/settings',
            views: {
                'menuContent': {
                    templateUrl: 'templates/settings.html',
                    controller: 'SettingsController'
                }
            }
        })
    ;
    $urlRouterProvider.otherwise('/app/main');
});

app.controller("ScanController", function ($scope, $cordovaBarcodeScanner) {
  $scope.scanBarcode = function () {
    $cordovaBarcodeScanner.scan().then(function (imageData) {
      $scope.data.room = imageData.text;
    }, function (error) {
      console.log("An error happened -> " + error);
    });
  };

});

app.controller('SettingsController', function ($scope, $stateParams, $localstorage, $state) {
  var temp_settings = $localstorage.get('settings');

  if (temp_settings) {
    $scope.settings = JSON.parse($localstorage.get('settings'));
  }

  if (!$scope.settings) {
    $scope.settings = {
      username: '',
      password: '',
      url: 'http://otrs.ap.be/otrs/nph-genericinterface.pl/Webservice/TestService/Ticket/Create',
    }
  }

  $scope.saveSettings = function () {
    $localstorage.set('settings', JSON.stringify($scope.settings));
  };

  $scope.cancel = function () {
    $state.go('app.main');
  };
});

app.controller('AppCtrl', function ($scope, $ionicSideMenuDelegate, $state) {
  $scope.toggleLeft = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };
});

app.controller('HomeCtrl', function ($scope) {});

app.factory('CreateTicketService', function ($resource, $localstorage) {
  var temp_settings = $localstorage.get('settings');

  if (temp_settings) {
    var settings = JSON.parse(temp_settings);
    return $resource(settings.url);
  }

  return null;
});

app.controller('TicketController', function ($scope, $http, CreateTicketService, $localstorage) {
  var temp_settings = $localstorage.get('settings');

  $scope.problems = [
    {
    title: 'Beamer',
    value: 'beamer'
  },
  {
    title: 'Geluidsinstallatie',
    value: 'sound'
  },
  {
    title: 'Computerprobleem',
    value: 'computer'
  },
  {
    title: 'Ander probleem',
    value: 'other'
  },
  ];

  $scope.data = {
    room: '',
    reason: '',
  };

  $scope.createTicket = function () {
    var temp_settings = $localstorage.get('settings');

    if (temp_settings) {
      var settings = JSON.parse(temp_settings);

      var data = {
        'UserLogin': settings.username,
        'Password': settings.password,
        'Ticket': {
          'Title': 'Telefoon Ticket - Room ' + $scope.data.room,
          'QueueID': 36,
          'LockID': 1,
          /* State
             1: new
             2: closed successful
             3: closed unsuccessful
             4: open
             5: removed
             6: pending reminder
             7: pending auto close+
             8: pending auto close-
             9: merged
             10: geen antwoord
             */
          'StateID': 1,
          /* Priority
             1: very low
             2: low
             3: normal
             4: high
             5: very high
             */
          'PriorityID': 1,
          'Owner': settings.username,
          'Responsible': settings.username,
          'CustomerUser': 'p064057@ap.be'
        },
        'Article': {
          'ArticleTypeID': 5,
          'Subject': 'Telefonische interventie',
          'Body': 'Telefonische interventie in lokaal ' + $scope.data.room + ' omwille van een probleem met ' + $scope.data.reason,
          'ContentType': 'text/plain; charset="iso-8859-1"'
        }
      };

      var result = CreateTicketService.save(data);
      $scope.log = JSON.stringify(result);
    };
  }
});
