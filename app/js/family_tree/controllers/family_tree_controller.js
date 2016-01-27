module.exports = function(app) {
  app.controller('FamilyTreeController', ['$scope', 'leafletData', '$http',
    function($scope, leafletData, $http) {

      var mapQuestKey = 'qszwthBye44A571jhqvCn4AWhTsEILRT';

      // required for cypher parser
      require('../../plugins/sigma.parsers.json.js');

      //for loading neo4j data from database
      require('../../plugins/sigma.parsers.cypher.js');

      // for styling the graph with labels, sizing, colors, etc.
      require('../../plugins/sigma.plugins.design.js');

      // directed graph layout algorithm
      require('../../plugins/sigma.layout.dagre.js');

      // sigma settings if needed
      var settings = {

      };

      // styling settings applied to graph visualization
      var treeStyles = {
        nodes: {
          label: {
            by: 'neo4j_data.name',
            format: function(value) { return 'Name: ' + value; }
          },

          size: {
            by: 'neo4j_data.nodeSize',
            bins: 10,
            min: 1,
            max: 20
          }
        }
      };

      $scope.drawTree = function() {
        var s = new sigma({
          container: 'graph-container',
          settings: settings
        });

        sigma.neo4j.cypher(
          { url: 'http://localhost:7474', user: 'neo4j', password: 'family' },
          "MATCH (n)-[r*0..]-(:User {username: '" + $scope.currentUser + "'}) RETURN n,r",
          s,
            function(s) {
              // sigma.plugins.killDesign(s);
              var design = sigma.plugins.design(s);
              // console.log(design);
              // design.setPalette(treePalette);
              design.setStyles(treeStyles);
              design.apply();

              var config = {
                rankdir: 'TB'
              };

              var listener = sigma.layouts.dagre.configure(s, config);

              listener.bind('start stop interpolate', function(event) {
                console.log(event.type);
              });

              sigma.layouts.dagre.start(s);

              s.refresh();

            }
        );
      }; // end drawTree function

      angular.extend($scope, {

        defaults: {
          scrollWheelZoom: true,
          doubleClickZoom: false,
          tap: false,
          tileLayer: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 14
        }
      });

      $scope.newRelative = {};

      //gets the current user's family tree.
      $scope.getTree = function() {
        $http.get('/' + $scope.currentUser.id)    // ROUTE?
        .then(function(res) {
          $scope.family = res.data;
      }, function(err) {
          console.log(err.data);
          });
      };

      //pulls info from FORM and sends post request
      $scope.addRelative = function(relative) {
        //Create two arrays to pass that the backend expects.
        relative.parents = [];
        relative.children = [];
        if(relative.parent1) relative.parents.push(relative.parent1._id);
        if(relative.parent2) relative.parents.push(relative.parent2._id);
        if(relative.child) relative.children.push(relative.child._id);

        $http.post('/api/tree', relative)
          .then(function(res) {
            $scope.drawTree();
            $scope.newRelative = {};
          }, function(err) {
            console.log(err.data);
          }
        );
      };


      //checks appropriate geocoding
      $scope.geoCodeResults = {};
      $scope.checkBirthGeocode = function(location) {
        var url = 'http://www.mapquestapi.com/geocoding/v1/address?key='
          + mapQuestKey
          + '&location=' + location
          + '&callback=JSON_CALLBACK';

        $http.jsonp(url)
          .success(function(data) {
            $scope.geoCodeResults = data;
            if (data.results[0].locations.length == 1) {
              $scope.newRelative.birthCoords = //need to be put in array for Neo4j
                [data.results[0].locations[0].latLng.lat,
                data.results[0].locations[0].latLng.lng];
            }
          });
      }; // End checkBirthGeocode

      $scope.checkDeathGeocode = function(location) {
        var url = 'http://www.mapquestapi.com/geocoding/v1/address?key='
          + mapQuestKey
          + '&location=' + location
          + '&callback=JSON_CALLBACK';

        $http.jsonp(url)
          .success(function(data) {
            $scope.geoCodeResults = data;
            if (data.results[0].locations.length == 1) {
              $scope.newRelative.deathCoords = //need to be put in array for Neo4j
                [data.results[0].locations[0].latLng.lat,
                data.results[0].locations[0].latLng.lng];
            }
          });
      }; // End checkDeathGeocode

    }]);
};
