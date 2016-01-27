module.exports = function(app) {
  app.directive('addPersonFormDirective', function() {
    return {
      restrict: 'AC',
      templateUrl: '/templates/add-person-form-template.html',
      replace: false,
      scope: {
        addRelative: '&',
        familyMembers: '=',
        checkDeathGeocode: '&',
        checkBirthGeocode: '&',
        geoCodeResults: '=',
        newRelative: '='
      }
    }
  });
};
