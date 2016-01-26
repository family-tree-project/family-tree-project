module.exports = function(app) {
  app.controller('SignupController', ['$scope', '$http', '$location', '$cookies', function($scope, $http, $location, $cookies) {
    $scope.h1Text = 'Family Tree Story Mapper Signup'
    $scope.buttonText = 'Create New User';
    $scope.confirmPassword = true;
    $scope.nameTaken = false;
    $scope.changePlacesText = 'Or Sign Into An Existing User';
    console.log($location.path());

    $scope.passwordMatch = function(user) {
      return user.password === user.confirmation;
    };

    $scope.changePlaces = function() {
      $location.path('/signin');
    };

    $scope.sendToServer = function(user) {
      $http.post('/api/signup', user)
      .then(function(res) {
        $cookies.put('token', res.data.token);
        $scope.getUser();   // from auth controller;
      }, function(err) {
        $scope.nameTaken = err.data.nameTaken;
        console.log(err);
      });
    };
  }]);
};
