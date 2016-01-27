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

      // for making arcs on the map
      // require('../../plugins/arc.js');

      'use strict';

      var D2R = Math.PI / 180;
      var R2D = 180 / Math.PI;

      var Coord = function(lon,lat) {
          this.lon = lon;
          this.lat = lat;
          this.x = D2R * lon;
          this.y = D2R * lat;
      };

      Coord.prototype.view = function() {
          return String(this.lon).slice(0, 4) + ',' + String(this.lat).slice(0, 4);
      };

      Coord.prototype.antipode = function() {
          var anti_lat = -1 * this.lat;
          var anti_lon = (this.lon < 0) ? 180 + this.lon : (180 - this.lon) * -1;
          return new Coord(anti_lon, anti_lat);
      };

      var LineString = function() {
          this.coords = [];
          this.length = 0;
      };

      LineString.prototype.move_to = function(coord) {
          this.length++;
          this.coords.push(coord);
      };

      var Arc = function(properties) {
          this.properties = properties || {};
          this.geometries = [];
      };

      Arc.prototype.json = function() {
          if (this.geometries.length <= 0) {
              return {'geometry': { 'type': 'LineString', 'coordinates': null },
                      'type': 'Feature', 'properties': this.properties
                     };
          } else if (this.geometries.length == 1) {
              return {'geometry': { 'type': 'LineString', 'coordinates': this.geometries[0].coords },
                      'type': 'Feature', 'properties': this.properties
                     };
          } else {
              var multiline = [];
              for (var i = 0; i < this.geometries.length; i++) {
                  multiline.push(this.geometries[i].coords);
              }
              return {'geometry': { 'type': 'MultiLineString', 'coordinates': multiline },
                      'type': 'Feature', 'properties': this.properties
                     };
          }
      };

      // TODO - output proper multilinestring
      Arc.prototype.wkt = function() {
          var wkt_string = '';
          var wkt = 'LINESTRING(';
          var collect = function(c) { wkt += c[0] + ' ' + c[1] + ','; };
          for (var i = 0; i < this.geometries.length; i++) {
              if (this.geometries[i].coords.length === 0) {
                  return 'LINESTRING(empty)';
              } else {
                  var coords = this.geometries[i].coords;
                  coords.forEach(collect);
                  wkt_string += wkt.substring(0, wkt.length - 1) + ')';
              }
          }
          return wkt_string;
      };

      /*
       * http://en.wikipedia.org/wiki/Great-circle_distance
       *
       */
      var GreatCircle = function(start,end,properties) {
          if (!start || start.x === undefined || start.y === undefined) {
              throw new Error("GreatCircle constructor expects two args: start and end objects with x and y properties");
          }
          if (!end || end.x === undefined || end.y === undefined) {
              throw new Error("GreatCircle constructor expects two args: start and end objects with x and y properties");
          }
          this.start = new Coord(start.x,start.y);
          this.end = new Coord(end.x,end.y);
          this.properties = properties || {};

          var w = this.start.x - this.end.x;
          var h = this.start.y - this.end.y;
          var z = Math.pow(Math.sin(h / 2.0), 2) +
                      Math.cos(this.start.y) *
                         Math.cos(this.end.y) *
                           Math.pow(Math.sin(w / 2.0), 2);
          this.g = 2.0 * Math.asin(Math.sqrt(z));

          if (this.g == Math.PI) {
              throw new Error('it appears ' + start.view() + ' and ' + end.view() + " are 'antipodal', e.g diametrically opposite, thus there is no single route but rather infinite");
          } else if (isNaN(this.g)) {
              throw new Error('could not calculate great circle between ' + start + ' and ' + end);
          }
      };

      /*
       * http://williams.best.vwh.net/avform.htm#Intermediate
       */
      GreatCircle.prototype.interpolate = function(f) {
          var A = Math.sin((1 - f) * this.g) / Math.sin(this.g);
          var B = Math.sin(f * this.g) / Math.sin(this.g);
          var x = A * Math.cos(this.start.y) * Math.cos(this.start.x) + B * Math.cos(this.end.y) * Math.cos(this.end.x);
          var y = A * Math.cos(this.start.y) * Math.sin(this.start.x) + B * Math.cos(this.end.y) * Math.sin(this.end.x);
          var z = A * Math.sin(this.start.y) + B * Math.sin(this.end.y);
          var lat = R2D * Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
          var lon = R2D * Math.atan2(y, x);
          return [lon, lat];
      };



      /*
       * Generate points along the great circle
       */
      GreatCircle.prototype.Arc = function(npoints,options) {
          var first_pass = [];
          if (!npoints || npoints <= 2) {
              first_pass.push([this.start.lon, this.start.lat]);
              first_pass.push([this.end.lon, this.end.lat]);
          } else {
              var delta = 1.0 / (npoints - 1);
              for (var i = 0; i < npoints; ++i) {
                  var step = delta * i;
                  var pair = this.interpolate(step);
                  first_pass.push(pair);
              }
          }
          /* partial port of dateline handling from:
            gdal/ogr/ogrgeometryfactory.cpp

            TODO - does not handle all wrapping scenarios yet
          */
          var bHasBigDiff = false;
          var dfMaxSmallDiffLong = 0;
          // from http://www.gdal.org/ogr2ogr.html
          // -datelineoffset:
          // (starting with GDAL 1.10) offset from dateline in degrees (default long. = +/- 10deg, geometries within 170deg to -170deg will be splited)
          var dfDateLineOffset = options && options.offset ? options.offset : 10;
          var dfLeftBorderX = 180 - dfDateLineOffset;
          var dfRightBorderX = -180 + dfDateLineOffset;
          var dfDiffSpace = 360 - dfDateLineOffset;

          // https://github.com/OSGeo/gdal/blob/7bfb9c452a59aac958bff0c8386b891edf8154ca/gdal/ogr/ogrgeometryfactory.cpp#L2342
          for (var j = 1; j < first_pass.length; ++j) {
              var dfPrevX = first_pass[j-1][0];
              var dfX = first_pass[j][0];
              var dfDiffLong = Math.abs(dfX - dfPrevX);
              if (dfDiffLong > dfDiffSpace &&
                  ((dfX > dfLeftBorderX && dfPrevX < dfRightBorderX) || (dfPrevX > dfLeftBorderX && dfX < dfRightBorderX))) {
                  bHasBigDiff = true;
              } else if (dfDiffLong > dfMaxSmallDiffLong) {
                  dfMaxSmallDiffLong = dfDiffLong;
              }
          }

          var poMulti = [];
          if (bHasBigDiff && dfMaxSmallDiffLong < dfDateLineOffset) {
              var poNewLS = [];
              poMulti.push(poNewLS);
              for (var k = 0; k < first_pass.length; ++k) {
                  var dfX0 = parseFloat(first_pass[k][0]);
                  if (k > 0 &&  Math.abs(dfX0 - first_pass[k-1][0]) > dfDiffSpace) {
                      var dfX1 = parseFloat(first_pass[k-1][0]);
                      var dfY1 = parseFloat(first_pass[k-1][1]);
                      var dfX2 = parseFloat(first_pass[k][0]);
                      var dfY2 = parseFloat(first_pass[k][1]);
                      if (dfX1 > -180 && dfX1 < dfRightBorderX && dfX2 == 180 &&
                          k+1 < first_pass.length &&
                         first_pass[k-1][0] > -180 && first_pass[k-1][0] < dfRightBorderX)
                      {
                           poNewLS.push([-180, first_pass[k][1]]);
                           k++;
                           poNewLS.push([first_pass[k][0], first_pass[k][1]]);
                           continue;
                      } else if (dfX1 > dfLeftBorderX && dfX1 < 180 && dfX2 == -180 &&
                           k+1 < first_pass.length &&
                           first_pass[k-1][0] > dfLeftBorderX && first_pass[k-1][0] < 180)
                      {
                           poNewLS.push([180, first_pass[k][1]]);
                           k++;
                           poNewLS.push([first_pass[k][0], first_pass[k][1]]);
                           continue;
                      }

                      if (dfX1 < dfRightBorderX && dfX2 > dfLeftBorderX)
                      {
                          // swap dfX1, dfX2
                          var tmpX = dfX1;
                          dfX1 = dfX2;
                          dfX2 = tmpX;
                          // swap dfY1, dfY2
                          var tmpY = dfY1;
                          dfY1 = dfY2;
                          dfY2 = tmpY;
                      }
                      if (dfX1 > dfLeftBorderX && dfX2 < dfRightBorderX) {
                          dfX2 += 360;
                      }

                      if (dfX1 <= 180 && dfX2 >= 180 && dfX1 < dfX2)
                      {
                          var dfRatio = (180 - dfX1) / (dfX2 - dfX1);
                          var dfY = dfRatio * dfY2 + (1 - dfRatio) * dfY1;
                          poNewLS.push([first_pass[k-1][0] > dfLeftBorderX ? 180 : -180, dfY]);
                          poNewLS = [];
                          poNewLS.push([first_pass[k-1][0] > dfLeftBorderX ? -180 : 180, dfY]);
                          poMulti.push(poNewLS);
                      }
                      else
                      {
                          poNewLS = [];
                          poMulti.push(poNewLS);
                      }
                      poNewLS.push([dfX0, first_pass[k][1]]);
                  } else {
                      poNewLS.push([first_pass[k][0], first_pass[k][1]]);
                  }
              }
          } else {
              // add normally
              var poNewLS0 = [];
              poMulti.push(poNewLS0);
              for (var l = 0; l < first_pass.length; ++l) {
                  poNewLS0.push([first_pass[l][0],first_pass[l][1]]);
              }
          }

          var arc = new Arc(this.properties);
          for (var m = 0; m < poMulti.length; ++m) {
              var line = new LineString();
              arc.geometries.push(line);
              var points = poMulti[m];
              for (var j0 = 0; j0 < points.length; ++j0) {
                  line.move_to(points[j0]);
              }
          }
          return arc;
      };


      // browser
      var arc = {};
      arc.Coord = Coord;
      arc.Arc = Arc;
      arc.GreatCircle = GreatCircle;

        console.log(arc);





















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
          { url: 'http://localhost:7474', user: 'neo4j', password: 'salmonz' },
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

      // defaults for leaflet
      angular.extend($scope, {

        defaults: {
          scrollWheelZoom: true,
          doubleClickZoom: false,
          tap: false,
          tileLayer: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 14
        },
        markers: {
          testmarker: {
            lat: 47.6,
            lng: -122.33,
            message: 'test marker'
          }
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

      $scope.mapFamily = function() {
        var markers = {};
        for (var i = 0; i < $scope.familyMembers.length; i++) {
          if ($scope.familyMembers[i].birthCoords) {
            markers[$scope.familyMembers[i].name] = {
              lng: $scope.familyMembers[i].birthCoords.lng,
              lat: $scope.familyMembers[i].birthCoords.lat
            };
          }
          if ($scope.familyMembers[i].deathCoords) {
            markers[$scope.familyMembers[i].name] = {
              lng: $scope.familyMembers[i].deathCoords.lng,
              lat: $scope.familyMembers[i].deathCoords.lat
            };
          }
        }
        angular.extend($scope, {
          markers: markers
        });
      };

      var start = { x: -122, y: 48 };
      var end = { x: -77, y: 39 };
      var generator = new arc.GreatCircle(start, end, {'name': 'Seattle to DC'});
      var line = generator.Arc(100,{offset:10});
      var geojson = line.json();

      leafletData.getMap().then(function(map) {
        console.log('plotting arc');
        L.geoJson(geojson).addTo(map);
      });

    }]);
};
