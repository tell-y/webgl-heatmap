var Framebuffer = require('./glFramebuffer');
var Texture = require('./glTexture');

function Node(gl, width, height) {
  var floatExt;
  this.gl = gl;
  this.width = width;
  this.height = height;
  floatExt = this.gl.getFloatExtension({
    require: ['renderable'],
  });
  this.texture = new Texture(this.gl, {
    type: floatExt.type,
  })
    .bind(0)
    .setSize(this.width, this.height)
    .nearest()
    .clampToEdge();
  this.fbo = new Framebuffer(this.gl)
    .bind()
    .color(this.texture)
    .unbind();
}

Node.prototype.use = function() {
  return this.fbo.bind();
};

Node.prototype.bind = function(unit) {
  return this.texture.bind(unit);
};

Node.prototype.end = function() {
  return this.fbo.unbind();
};

Node.prototype.resize = function(width, height) {
  this.width = width;
  this.height = height;
  return this.texture.bind(0).setSize(this.width, this.height);
};

module.exports = Node;
