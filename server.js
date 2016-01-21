require('dotenv').load({silent: true}); //loads environment variables defined in .env; for use in development; detects that .env exists

var express = require('express');
var app = express();
var familyTreeRouter = require(__dirname + '/routes/family_tree_routes.js');

app.use('/', familyTreeRouter);

app.listen(3000, function() {
  console.log('server up on 3000');
});
