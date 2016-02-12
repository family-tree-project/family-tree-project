//Changes a string of comma-separated values to an array of 2 numbers if needed
module.exports = function(coords) {
  if(typeof coords === 'string') {
    coordsArray = coords.split(',');
    return [parseFloat(coordsArray[0]), parseFloat(coordsArray[1])];
  }
  else {
    return coords || [];
  }
};
