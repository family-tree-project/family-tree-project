var express = require('express');
var jsonParser = require('body-parser').json();

var node_neo4j = require('node-neo4j');
var dbAddress = 'http://' + process.env.NEO4J_USERNAME + ':' + process.env.NEO4J_PASSWORD + '@localhost:7474';
var GRAPHENEDB_URL = GRAPHENEDB_URL || dbAddress
var db = new node_neo4j(GRAPHENEDB_URL);

var familyTreeRouter = module.exports = exports = express.Router();

// NODE           (identifier:Schema {prop: value})
// RELATIONSHIP   -[identifier:RELATIONSHIP_TYPE {prop: value}]-> (arrow indicates directed relationship)
// ASSIGN PATTERN identifier = (:Schema)-[:TYPE]->(:Schema2)

/*
Routes needed:
GET     - show example trees for non-users
GET     - show a user's own tree
POST    - create user node on sign-in
POST    - create family-member nodes from user input
PUT     - change nodes from user input
DELETE  - remove nodes from user input
DELETE  - remove all nodes related to user if account is deleted
*/

//default
familyTreeRouter.get('/', function(req, res) {
  db.cypherQuery("MATCH path=()-[d*]->(n:testUser)-[a*]->() RETURN relationships(path)", function(err, results) {
      if(err) {
        throw err;
      }

      // console.log(results);
      // for(var i = 0; i < results.data.length; i++) {
      //   console.log("row " + i + ":\n", results.data[i]);
      // }
      res.json(results.data);
  });
});

var node_params = "name: {name},"
  + "birthDate: {birthDate},"
  + "birthLoc: {birthLoc},"
  + "deathDate: {deathDate},"
  + "deathLoc: {deathLoc}";
var queries = {
  findParents:
    "MATCH (p1)-[]->(onode)<-[]-(p2) "
    + "WHERE id(p1)={parent1} AND id(p2)={parent2} "
    + "RETURN onode",
  createNodeWithParents:
    "MATCH (onode) WHERE id(onode)={offspringNodeID} "
      + "CREATE (:Person {" + node_params
      + "})<-[:CHILD]-(onode)",
  createNodeWithChild:
    "MATCH (child) WHERE id(child)={childNodeID} "
      + "CREATE (:Person {" + node_params
      + "})-[:PARENTED]->(offspringNode:Offspring)-[:CHILD]->(child) "
      + "CREATE (:Person {name: 'Not Specified'})-[:PARENTED]->(offspringNode) "
      + "RETURN offspringNode"
}

familyTreeRouter.post('/tree', jsonParser, function(req, res) {
  //User will give name, birthDate, birthLoc, deathDate, deathLoc, parents and/or children (by id)
  //When specifying parents, both must exist (for now) to find their offspring node
  console.log("req data: ", req.body.parents);

  if(req.body.parents.length === 2) {
    db.cypherQuery(queries.findParents,
      {
        parent1: req.body.parents[0],
        parent2: req.body.parents[1]
      },
      function(err, result) {
        if(err) throw err;

        db.cypherQuery(queries.createNodeWithParents,
        {
          name: req.body.name,
          birthDate: req.body.birthDate,
          birthLoc: req.body.birthLoc,
          deathDate: req.body.deathDate,
          deathLoc: req.body.deathLoc,
          offspringNodeID: result.data[0]._id
        },
        function(err, result) {
          if(err) throw err;

          res.json({msg: 'Member added'});
        });
      }
    );
  }

  //When specifying child(ren) and no parents exist, a new offspring node and unspecified parent need to be created.
  else if(req.body.children.length) {
    db.cypherQuery(queries.createNodeWithChild,
    {
      name: req.body.name,
      birthDate: req.body.birthDate,
      birthLoc: req.body.birthLoc,
      deathDate: req.body.deathDate,
      deathLoc: req.body.deathLoc,
      childNodeID: req.body.children[0]
    },
    function(err, result) {
      if(err) throw err;

      res.json({msg: 'Member added'});
    });
  }
});

familyTreeRouter.put('/tree', jsonParser, function(req, res) {
  
});
