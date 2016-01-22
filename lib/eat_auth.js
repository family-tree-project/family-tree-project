// var eat = require('eat');
// var User = require(__dirname + '/../models/user.js');
// var handleError = require(__dirname + '/handleErrors.js');

// module.exports = exports = function(req, res, next) {
//   var encryptedToken =   req.headers.token || ((req.body) ? req.body.token : undefined);

//   if (!encryptedToken) {
//     return res.status(401).json({msg: 'Could not authenticate, yo!'});
//   }
//   eat.decode(encryptedToken, process.env.APP_SECRET, function(err, token) {
//     if (err)  return res.status(401).json({msg: 'Could not authenticate! bad token'});
//     User.findOne({_id: token.id}, function(err, user) {
//       if (err) return handleError(err, res);
//       if (!user) return res.status(401).json({msg: 'Could not authenticate, so deal with it!'});
//       req.user = user; // if there actually is a user matching the token id, then make req.user be the same
//       next();
//     });
//   });
// };
