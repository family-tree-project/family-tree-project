module.exports = function(app) {
  app.directive('addPersonFormDirective', function() {
    return {
      restrict: 'AC',
      templateUrl: '/templates/add_person_form_template.html',
      replace: false,
      transclude: true,
      scope: {
        buttonText: '@',
        save: '&',
        familyMembers: '=',
        checkDeathGeocode: '&',
        checkBirthGeocode: '&',
        geoCodeResults: '=',
        relative: '=',
        editing: '&'
      }
    }
  });
};
