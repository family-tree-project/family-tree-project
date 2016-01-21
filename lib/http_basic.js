// this is middleware! It will be used  as in intermediate callback BEFORE the last callback on a .get() request

//the PURPOSE of this middleware on the server is to set up req.auth to have a username and password properties with human-readable values out of the  'Basic username:password' string - with the password encoded when it is sent from the user to the server. This req.auth is then used in the next callback of the request.

// module.exports = exports = function(req, res, next) {
//   var userPassEncoded = (req.headers.authorization || ' :').split(' ')[1]; // req.headers.authorization is normally someting like 'Basic testname:testpass', but the string is encoded in base 64 as per the standard.  so this splits on the space to give ['Basic', 'testname:testpass'] and the [1] is then 'testname:testpass'.  (both strings are still in base64!)

//   // if !req.headers.authorization then  this would split ' :'  to give ['', ':'] and then take [1] as ':' so if blank then we will end up with no testname and no testpass. ergo  no authentication for blanks.

//   var userPassBuf = new Buffer(userPassEncoded, 'base64'); //turns the base 64 string of 'testname:testpass' into a buffer so that it can later be convereted to a utf8 string

//   var utf8String = userPassBuf.toString('utf8'); // make a human-readable string out of the base64 data

//   var splitNameAndPass = utf8String.split(':'); // splits the string 'testname:testpass' into to parts  ['testname', 'testpass'] (both now in human-readable format utf8)

//   req.auth = { //can now use the split string to get at 'testname' and 'testpass' individually
//     username: splitNameAndPass[0],
//     password: splitNameAndPass[1]
//   };

//   // Now check that BOTH username AND password actually exist (that neither is undefined or blank.) In order to do this, check the length. Undefined does not have a length whereas an empty string DOES have a length of 0. But in either case, those are FALSY. and !falsy  is truthy.. so bottom line: if either piece is undefined (no length) or blank (length 0) then the 'could not authenticate' will run. If both are truthy (length > 1) then !truthy is false, and 'could not authenticate will NOT run'. So this checks that there are actual values for name and pass. it does NOT check if they are right! It just checks if we could continue trying to authenticate if ther are acutally things present TO authenticate!

//   if (!(req.auth.username.length && req.auth.password.length)) {
//     console.log('Could not authenticate - username and/or password blank ' + req.auth.username);
//     return res.status(401).send({msg: 'Could not authenticate - username and/or password blank'});
//   }
//   next(); // needed becasue  this is used as the FIRST callback in a .get() request.  The expressJS docs say to use next() to call the next callback.
//   // .get(/somePath, cb1, cb2)
// };
