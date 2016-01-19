var express = require('express');
var app = express();
var familyTreeRouter = require(__dirname + '/routes/family_tree_routes.js');

app.use('/', familyTreeRouter);

app.listen(3000, function() {
  console.log('server up on 3000');
});
