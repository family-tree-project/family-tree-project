module.exports = function(app) {
  require('./controllers/signup_controller.js')(app);
  require('./controllers/signin_controller.js')(app);
};
