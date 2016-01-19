// This is a TEMPLATE VERSION of client tests. all-caps comments indicate
// sections which will need to be updated once angular app is constructed.
// Because it can't be run until those pieces are built, anticipate debugging
// the first time tests are run. Also, actually construct test conditions!

require('/../')                           //INSERT FILEPATH TO APP ENTRY
require('angular-mocks');

describe('controller', function() {
  var $httpBackend;
  var $ControllerConstructor;
  var $scope;

  beforeEach(angular.mock.module('***'));           //INSERT ANGULAR APP NAME HERE

  beforeEach(angular.mock.inject(function($rootScope, $controller) {
    $scope = $rootScope.$new();
    $ControllerConstructor = $controller;
  }));

  // Test that test harness is running properly,
  // and that mocked angular environment corresponds correctly to controller

  it('should create a controller', function() {
    var controller = $ControllerConstructor('TestController', {$scope: $scope}); //REPLACE TESTCONTROLLER
    expect(typeof $scope).toBe('object');
    expect(typeof controller).toBe('object');
                                                    //INSERT ANY CONTROLLER $SCOPE PROPERTIES HERE
  });

  describe('REST functionality', function() {
    beforeEach(angular.mock.inject(function(_$httpBackend_, $rootScope) {
      $httpBackend = _$httpBackend_;
      $scope = $rootScope.$new();
      $ControllerConstructor('TestController', {$scope: $scope});                 //REPLACE TESTCONTROLLER
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('Should deal with a getAll request', function() {
      $httpBackend.expectGET('/api/ROUTERNAME').respond(200, [{}]);    // REPLACE ROUTE NAME, TEST OBJ
      $scope.getAll();                              // IS THIS THE ACTUAL CONTROLLER FUNCTION NAME?
      $httpBackend.flush();
      expect();                                     //WRITE EXPECT STATEMENTS
    });

    it('Should post', function() {
      $httpBackend.expectPOST('/api/ROUTERNAME', {}).respond(200, {}) // REPLACE ROUTE NAME, TEST OBJS
      expect();                                     // WRITE PRECONDITIONS
      $scope.create({});                            // IS THIS THE ACTUAL CONTROLLER FUNC NAME? WRITETEST OBJ
      $httpBackend.flush();
      expect();                                     // WRITE EXPECT STATEMENTS
    });

    it('should update', function() {
      // Need an object to be populated in an $scope array?
      $httpBackend.expectPUT('/api/ROUTERNAME', {}).respond(200, {}); // REPLACE ROUTE NAME, TEST OBJS
      $scope.update({});                            // IS THIS CONTROLLER FUNC NAME? WRITE TEST OBJ
      $httpBackend.flush();
      expect();                                     // WRITE EXPECT STATEMENTS
    });

    it('should delete', function() {
      // need an object to be populated in $scope array?
      $httpBackend.expectDELETE('/api/ROUTERNAME', {}).respond(200, {});
      $scope.delete({});
      $httpBackend.flush();
      expect();
    })

  });


}
