module.exports = function(app) {
  app.directive('addPersonFormDirective', function() {
    return {
      restrict: 'AC',
      templateUrl: '/templates/add-person-form-template.html',
      transclude: true,
      replace: false,
      scope: {
        resource: '=',
        title: '@'
      }
    }
  });
};
