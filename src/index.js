var WebGLHeatmap = require('./webGLHeatmap');
var nukeVendorPrefix = require('./nukeVendorPrefix');
var textureFloatShims = require('./textureFloatShims');

nukeVendorPrefix();
textureFloatShims();

module.exports = function(params) {
  return new WebGLHeatmap(params);
};
