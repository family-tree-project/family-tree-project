var chai = require('chai');
var expect = chai.expect;
var chaiHTTP = require('chai-http');
chai.use(chaiHTTP);
var fs = require('fs');

require(__dirname + '/../server.js');

var familyTreeRouter = require(__dirname + '/../routes/family_tree_routes');

var node_neo4j = require('node-neo4j');
var dbAddress = 'http://' + process.env.NEO4J_USERNAME + ':' + process.env.NEO4J_PASSWORD + '@localhost:7474';
var GRAPHENEDB_URL = GRAPHENEDB_URL || dbAddress
var db = new node_neo4j(GRAPHENEDB_URL);

var url = "localhost:3000";
var test_tree = fs.readFileSync(__dirname + '/test_tree.txt', {encoding: 'utf-8'});

describe("The database", function() {
  var nodes_array;
  var father_node;
  var mother_node;
  var spouse_node;

  
  before(function(done) {
    db.cypherQuery(test_tree, function(err, results) {
      if(err) {
        throw err;
      }

      nodes_array = results.data[0];
      console.log("Created: ", results.data[0]);

      nodes_array.forEach(function(node) {
        if(node.name === 'father') {
          father_node = node;
        }
        if(node.name === 'mother') {
          mother_node = node;
        }
        if(node.name === 'spouse') {
          spouse_node = node;
        }
      });

      done();
    });
  });

  // after(function(done) {
  //   db.cypherQuery("MATCH (n:testUser)-[*]-(m) DETACH DELETE n,m", function(err, data) {
  //     if(err) throw err;
  //     done();
  //   });
  // });

  it("should GET the example tree", function(done) {
    chai.request(url)
      .get('/')
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(typeof res.body).to.eql('object');
        done();
      });
  });

  it("should add a new child member (POST)", function(done) {
    chai.request(url)
      .post('/tree')
      .send({
        name: "Sibling Test",
        birthDate: new Date(1950, 3, 17),
        deathDate: null, 
        birthLoc: [47.6062, -122.3321],
        deathLoc: [],
        parents: [mother_node._id, father_node._id],
        children: []
      })
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.msg).to.eql("Member added")
        done();
      });
  });

  it("should add a new parent member (POST)", function(done) {
    chai.request(url)
      .post('/tree')
      .send({
        name: "In-Law Test",
        birthDate: new Date(1925, 3, 17),
        deathDate: null, 
        birthLoc: [47.6062, -122.3321],
        deathLoc: [],
        parents: [],
        children: [spouse_node._id]
      })
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.msg).to.eql("Member added")
        done();
      });
  });

  it("should add a new member with parents and children")

  it("should update a family member's data (PUT)", function(done) {
    chai.request(url)
      .put('/tree')
      .send({
        id: father_node._id,
        birthDate: new Date(1922, 5, 30),
        deathDate: new Date(2005, 10, 4),
        birthLoc: [52.302, 13.2356],
        deathLoc: [47.6062, -122.3321]
      })
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.msg).to.eql("Member updated");
        done();
      });
  });

  it("should DELETE a family member");
});