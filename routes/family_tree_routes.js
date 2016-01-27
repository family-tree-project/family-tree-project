var express = require('express');
var jsonParser = require('body-parser').json();

var mongoose = require('mongoose');
var connection = mongoose.createConnection(process.env.MONGOLAB_URI);
var Authenticat = require('authenticat');
var authenticat = new Authenticat(connection);

var node_neo4j = require('node-neo4j');
process.env.GRAPHENEDB_URL = process.env.GRAPHENEDB_URL
  || 'http://' + process.env.NEO4J_USERNAME + ':' + process.env.NEO4J_PASSWORD + '@localhost:7474';
var db = new node_neo4j(process.env.GRAPHENEDB_URL);

var handleError = require(__dirname + '/../lib/error_handler');

var familyTreeRouter = module.exports = exports = express.Router();

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
  db.cypherQuery("MATCH (p:Person)-[r*0..]-(:sampleUser) RETURN p,r", function(err, results) {
      if(err) {
        return handleError(err, res, 500);
      }

      return res.json(results.data);
  });
});

// NODE           (identifier:Schema {prop: value})
// RELATIONSHIP   -[identifier:RELATIONSHIP_TYPE {prop: value}]-> (arrow indicates directed relationship)
// ASSIGN PATTERN identifier = (:Schema)-[:TYPE]->(:Schema2)
var queries = function() {
  var node_params = "name: {name},"
    + "birthDate: {birthDate},"
    + "birthLoc: {birthLoc},"
    + "birthCoords: {birthCoords},"
    + "deathDate: {deathDate},"
    + "deathLoc: {deathLoc},"
    + "deathCoords: {deathCoords},"
    + "nodeSize: 5";  //arbitrary field that the rendering engine needs

  return {
    findParents:
      "MATCH (p1)-[]->(onode)<-[]-(p2) "
      + "WHERE id(p1)={parent1} AND id(p2)={parent2} "
      + "RETURN onode",
    findFamily:
      "MATCH (p:Person)-[*0..]-(:User {username: {username}}) RETURN p",
    createNodeWithParents:
      "MATCH (onode) WHERE id(onode)={offspringNodeID} "
        + "CREATE (:Person {" + node_params
        + "})<-[:CHILD]-(onode)",
    createNodeWithChild:
      "MATCH (child) WHERE id(child)={childNodeID} "
        + "CREATE (:Person {" + node_params
        + "})-[:PARENTED]->(offspringNode:Offspring {nodeSize: 1})-[:CHILD]->(child) "
        + "CREATE (:Person {name: 'Not Specified', nodeSize: 3})-[:PARENTED]->(offspringNode) "
        + "RETURN offspringNode"
  }
}();

familyTreeRouter.post('/tree', jsonParser, authenticat.tokenAuth, function(req, res) {
  //User will give name, birthDate, birthLoc, deathDate, deathLoc, parents and/or children (by id)
  //When specifying parents, both must exist (for now) to find their offspring node

  console.log("POST /tree:\n", req.body);

  if(req.body.parents.length === 2) {
    db.cypherQuery(queries.findParents,
      {
        parent1: req.body.parents[0],
        parent2: req.body.parents[1]
      },
      function(err, result) {
        if(err) {
          return handleError(err, res, 500);
        }

        db.cypherQuery(queries.createNodeWithParents,
        {
          name: req.body.name,
          birthDate: req.body.birthDate,
          birthLoc: req.body.birthLoc,
          birthCoords: req.body.birthCoords,
          deathDate: req.body.deathDate || '',
          deathLoc: req.body.deathLoc || '',
          deathCoords: req.body.deathCoords || '',
          offspringNodeID: result.data[0]._id
        },
        function(err, result) {
          if(err) {
            return handleError(err, res, 500);
          }

          return res.json({msg: 'Member added'});
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
      birthCoords: req.body.birthCoords,
      deathDate: req.body.deathDate || '',
      deathLoc: req.body.deathLoc || '',
      deathCoords: req.body.deathCoords || '',
      childNodeID: req.body.children[0]
    },
    function(err, result) {
      if(err) {
        return handleError(err, res, 500);
      }

      return res.json({msg: 'Member added'});
    });
  }
});

//Update a family member's data
familyTreeRouter.put('/tree', jsonParser, authenticat.tokenAuth, function(req, res) {
  db.readNode(req.body.id, function(err, node) {
    db.updateNode(req.body.id,
      {
        //db.updateNode replaces all node properties, so all fields need to be assigned to avoid losing any
        name: req.body.name || node.name,
        birthDate: req.body.birthDate || node.birthDate,
        birthLoc: req.body.birthLoc || node.birthLoc,
        birthCoords: req.body.birthCoords || node.birthCoords,
        deathDate: req.body.deathDate || node.deathDate,
        deathLoc: req.body.deathLoc || node.deathLoc,
        birthCoords: req.body.birthCoords || node.birthCoords,
        nodeSize: 5 //if this was previously a 'Not Specified' person, make its new size equal to a real person
      },
      function(err, result) {
        if(err) {
          return handleError(err, res, 500);
        }

        return res.json({msg: "Member updated"});
      }
    );
  });
});

//Route that returns the user's tree (creating a new one for new users) on sign in/up.
familyTreeRouter.post('/user-tree', jsonParser, authenticat.tokenAuth, function(req, res) {
  db.readNodesWithLabelsAndProperties('User', {username: req.body.username}, function(err, userNodeArray) {
    if(err) {
      return handleError(err, res, 500);
    }

    if(!userNodeArray.length) { //no node found; create new one, and return it as an array of objects
      db.insertNode({ //properties
          username: req.body.username,
          name: req.body.username
        }, ['User', 'Person'], //labels
        function(err, result) {
          //result is a JSON for the node
          if(err) {
            return handleError(err, res, 500);
          }

          return res.json({data: [result]});
        }
      );
    }
    else { //found a node; return its family as an array of objects
      db.cypherQuery(queries.findFamily, {username: req.body.username}, function(err, result) {
        if(err) {
          return handleError(err, res, 500);
        }

        return res.json({data: result.data});
      });
    }
  });
});
