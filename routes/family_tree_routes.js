var express = require('express');
var bodyParser = require('body-parser');

var familyTreeRouter = module.exports = exports = express.Router();

familyTreeRouter.get('/familyTrees', function(req, res) {
  res.send(data);
});
