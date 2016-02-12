module.exports = function(app) {
  app.controller('SigninController', ['$scope', '$http', '$base64', '$location', '$cookies', function($scope, $http, $base64, $location, $cookies) {
    $scope.h3Text = 'Signin page'
    $scope.buttonText = 'Log In';
    $scope.confirmPassword = false;
    $scope.wrongPassword = false;
    $scope.user = {};
    $scope.changePlacesText = 'Or Create A New User';

    $scope.changePlaces = function() {
      $location.path('/signup');
    };

    $scope.sendToServer = function(user) {
      $http({
        method: 'GET',
        url: '/api/signin',
        headers: {
          'Authorization': 'Basic ' + $base64.encode(user.username + ':' + user.password)
        }
      })
      .then(function(res) {
        $cookies.put('token', res.data.token);
        $scope.getUser();   // from auth controller;
      }, function(err) {
        console.log(err);
        $scope.wrongPassword = err.data.wrongPassOrUser;
      });
    };
  }]);
};
