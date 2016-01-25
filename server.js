require('dotenv').load({silent: true}); //loads environment variables defined in .env; for use in development; detects that .env exists

var express = require('express');
var app = express();
var Authenticat = require('authenticat');
var mongoose = require('mongoose');
var connection = mongoose.createConnection(process.env.MONGOLAB_URI);
var authenticat = new Authenticat(connection);

var familyTreeRouter = require(__dirname + '/routes/family_tree_routes.js');

app.use(express.static(__dirname + '/build'));

mongoose.connection.on( 'error', function(err) {
  console.log( 'connection failed: ' + err);
});

connection.on( 'connected', function() {
  console.log( 'connected successfully ');
});

app.use('/api', authenticat.router);
app.get('/user', authenticat.tokenAuth, function(req, res) {
  res.json({username: req.user.username});
});

app.use('/api', familyTreeRouter);

app.listen(3000, function() {
  console.log('server up on port 3000');
});
