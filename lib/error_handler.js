module.exports = function(err, res, status) {
  console.log(err);

  return res.status(status).json({msg: "ERROR OF SOME SORT"});
};