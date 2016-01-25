module.exports = function(app) {
  app.controller('FamilyTreeController', ['$scope', 'leafletData', '$http',
    function($scope,leafletData, $http) {

      angular.extend($scope, {

        defaults: {
          scrollWheelZoom: true,
          doubleClickZoom: false,
          tap: false,
          tileLayer: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 14
        }
      });

      $scope.family = ['No family members to display!'];
      $scope.newRelative = {};

      //gets the current user's family tree.
      $scope.getTree = function() {
        $http.get('/' + $scope.currentUser.id)    // ROUTE?
        .then(function(res) {
          $scope.family = res.data;
      }, function(err) {
          console.log(err.data);
      });
      }

      //pulls info from FORM and sends post request
      $scope.addRelative = function(relative) {
        $http.post('/', relative)                  // ROUTE?
        .then(function(res) {
          $scope.makeTree();                      // Function name/params?
          $scope.newRelative = {};
        }, function(err) {
          console.log(err.data);
        });
      }

      //checks appropriate geocoding
      $scope.checkGeocode = function(location) {

      }

    }]);
};
