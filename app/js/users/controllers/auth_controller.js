module.exports = function(app) {
  app.controller('AuthController', ['$scope', '$http', '$location', '$cookies', function($scope, $http, $location, $cookies) {
    $scope.getUser = function() {
      $scope.token = $cookies.get('token');
      $http.defaults.headers.common.token = $scope.token;
      $http.get('/user')
      .then(function(res) {
        $scope.currentUser = res.data.username;
        $http.post('/api/user-tree', res.data)
        .then(function(res) {
          $scope.familyMembers = res.data;
          $location.path('/tree')
        }, function(err) {
          console.log(err);
        });
      }, function(err) {
        console.log(err);
      });
    }

    $scope.logOut = function() {
      $scope.token = null;
      $scope.currentUser = null;
      $cookies.remove('token');
      $location.path('/signup');
    }
  }]);
};
