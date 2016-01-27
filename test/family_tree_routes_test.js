var chai = require('chai');
var expect = chai.expect;
var chaiHTTP = require('chai-http');
chai.use(chaiHTTP);
var fs = require('fs');

var mongoose = require('mongoose');
process.env.MONGOLAB_URI = 'mongodb://localhost/family_tree_test';
var connection = mongoose.createConnection(process.env.MONGOLAB_URI);

require(__dirname + '/../server.js');

var familyTreeRouter = require(__dirname + '/../routes/family_tree_routes');

var node_neo4j = require('node-neo4j');
process.env.GRAPHENEDB_URL = process.env.GRAPHENEDB_URL
  || 'http://' + process.env.NEO4J_USERNAME + ':' + process.env.NEO4J_PASSWORD + '@localhost:7474';
var db = new node_neo4j(process.env.GRAPHENEDB_URL);

var url = "localhost:3000";
var test_tree = fs.readFileSync(__dirname + '/test_tree.txt', {encoding: 'utf-8'});

describe("The tree routes", function() {
  var nodes_array;
  var father_node;
  var mother_node;
  var spouse_node;
  var token;

  before(function(done) {
    chai.request(url)
      .post('/api/signup')
      .send({
        username: 'dbtester',
        password: '1234',
        confirmation: '1234'
      })
      .end(function(err, res) {
        token = res.body.token;

        db.cypherQuery(test_tree, function(err, results) {
          if(err) throw err;

          nodes_array = results.data[0];

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
  });

  after(function(done) {
    connection.db.dropDatabase(function() {
      done();
    });

    db.cypherQuery("MATCH (n:testUser)-[*]-(m) DETACH DELETE n,m", function(err, data) {
      if(err) throw err;

      db.cypherQuery("MATCH (n:User {name: '!@#$%^&*()', username: '!@#$%^&*()'})-[*]-(m) DETACH DELETE n,m",
        function(err, data) {
          if(err) throw err;

          db.cypherQuery("MATCH (n:User {name: ')(*&^%$#@!', username: ')(*&^%$#@!'}) DELETE n",
            function(err, data) {
            if(err) throw err;

            done();
            }
          );
        }
      );
    });
  });

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
      .post('/api/tree')
      .send({
        token: token,
        name: "Sibling Test",
        birthDate: new Date(1950, 3, 17),
        deathDate: null, 
        birthLoc: 'Seattle',
        birthCoords: [47.6062, -122.3321],
        deathLoc: '',
        deathCoords: [],
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
      .post('/api/tree')
      .send({
        token: token,
        name: "In-Law Test",
        birthDate: new Date(1925, 3, 17),
        deathDate: null, 
        birthLoc: 'Seattle',
        birthCoords: [47.6062, -122.3321],
        deathLoc: '',
        deathCoords: [],
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
      .put('/api/tree')
      .send({
        token: token,
        id: father_node._id,
        name: 'dad',
        birthDate: new Date(1922, 5, 30),
        deathDate: new Date(2005, 10, 4),
        birthLoc: 'Someplace',
        birthCoords: [52.302, 13.2356],
        deathLoc: 'Seattle',
        deathCoords: [47.6062, -122.3321]
      })
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.msg).to.eql("Member updated");
        done();
      });
  });

  it("should DELETE a family member");

  describe("that deal with user nodes and trees", function() {
    before(function(done) {
      db.cypherQuery("CREATE (:Person {name: 'father'})-[:PARENTED]->(o:Offspring)<-[:PARENTED]-(:Person {name: 'mother'}) CREATE (o)-[:CHILD]->(u:User:Person {name: '!@#$%^&*()', username: '!@#$%^&*()'})-[:PARENTED]->(:Offspring)<-[:PARENTED]-(:Person {name: 'spouse'}) RETURN u",
        function(err, result) {
          if(err) throw err;
          done();
        }
      );
    });

    it("should create a new user node and return it", function(done) {
      chai.request(url)
        .post('/api/user-tree')
        .send({
          token: token,
          username: ')(*&^%$#@!'
        })
        .end(function(err, res) {
          expect(err).to.eql(null);
          expect(res.body.data.length).to.eql(1);
          expect(res.body.data[0].username).to.eql(')(*&^%$#@!');
          done();
        });
    });

    it("should return an existing user's family's nodes", function(done) {
      chai.request(url)
        .post('/api/user-tree')
        .send({
          token: token,
          username: '!@#$%^&*()'
        })
        .end(function(err, res) {
          expect(err).to.eql(null);
          expect(res.body.data.length).to.eql(4);
          expect(res.body.data[0].username).to.eql('!@#$%^&*()');
          done();
        });
    });
  });
});
