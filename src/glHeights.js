var vertexShaderBlit = require('./vertexShaderBlit');
var fragmentShaderBlit = require('./fragmentShaderBlit');
var Shader = require('./glShader');
var Node = require('./glNode');

function Heights(heatmap, gl, width, height) {
  var i, _i, _ref;
  this.heatmap = heatmap;
  this.gl = gl;
  this.width = width;
  this.height = height;
  this.shader = new Shader(this.gl, {
    vertex:
      'attribute vec4 position, intensity;\nvarying vec2 off, dim;\nvarying float vIntensity;\nuniform vec2 viewport;\n\nvoid main(){\n    dim = abs(position.zw);\n    off = position.zw;\n    vec2 pos = position.xy + position.zw;\n    vIntensity = intensity.x;\n    gl_Position = vec4((pos/viewport)*2.0-1.0, 0.0, 1.0);\n}',
    fragment:
      '#ifdef GL_FRAGMENT_PRECISION_HIGH\n    precision highp int;\n    precision highp float;\n#else\n    precision mediump int;\n    precision mediump float;\n#endif\nvarying vec2 off, dim;\nvarying float vIntensity;\nvoid main(){\n    float falloff = (1.0 - smoothstep(0.0, 1.0, length(off/dim)));\n    float intensity = falloff*vIntensity;\n    gl_FragColor = vec4(intensity);\n}',
  });
  this.clampShader = new Shader(this.gl, {
    vertex: vertexShaderBlit,
    fragment:
      fragmentShaderBlit +
      'uniform float low, high;\nvoid main(){\n    gl_FragColor = vec4(clamp(texture2D(source, texcoord).rgb, low, high), 1.0);\n}',
  });
  this.multiplyShader = new Shader(this.gl, {
    vertex: vertexShaderBlit,
    fragment:
      fragmentShaderBlit +
      'uniform float value;\nvoid main(){\n    gl_FragColor = vec4(texture2D(source, texcoord).rgb*value, 1.0);\n}',
  });
  this.blurShader = new Shader(this.gl, {
    vertex: vertexShaderBlit,
    fragment:
      fragmentShaderBlit +
      'uniform vec2 viewport;\nvoid main(){\n    vec4 result = vec4(0.0);\n    for(int x=-1; x<=1; x++){\n        for(int y=-1; y<=1; y++){\n            vec2 off = vec2(x,y)/viewport;\n            //float factor = 1.0 - smoothstep(0.0, 1.5, length(off));\n            float factor = 1.0;\n            result += vec4(texture2D(source, texcoord+off).rgb*factor, factor);\n        }\n    }\n    gl_FragColor = vec4(result.rgb/result.w, 1.0);\n}',
  });
  this.nodeBack = new Node(this.gl, this.width, this.height);
  this.nodeFront = new Node(this.gl, this.width, this.height);
  this.vertexBuffer = this.gl.createBuffer();
  this.vertexSize = 8;
  this.maxPointCount = 1024 * 10;
  this.vertexBufferData = new Float32Array(
    this.maxPointCount * this.vertexSize * 6
  );
  this.vertexBufferViews = [];
  for (
    i = _i = 0, _ref = this.maxPointCount;
    0 <= _ref ? _i < _ref : _i > _ref;
    i = 0 <= _ref ? ++_i : --_i
  ) {
    this.vertexBufferViews.push(
      new Float32Array(this.vertexBufferData.buffer, 0, i * this.vertexSize * 6)
    );
  }
  this.bufferIndex = 0;
  this.pointCount = 0;
}

Heights.prototype.resize = function(width, height) {
  this.width = width;
  this.height = height;
  this.nodeBack.resize(this.width, this.height);
  return this.nodeFront.resize(this.width, this.height);
};

Heights.prototype.update = function() {
  var intensityLoc, positionLoc;
  if (this.pointCount > 0) {
    this.gl.enable(this.gl.BLEND);
    this.nodeFront.use();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.vertexBufferViews[this.pointCount],
      this.gl.STREAM_DRAW
    );
    positionLoc = this.shader.attribLocation('position');
    intensityLoc = this.shader.attribLocation('intensity');
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(
      positionLoc,
      4,
      this.gl.FLOAT,
      false,
      8 * 4,
      0 * 4
    );
    this.gl.vertexAttribPointer(
      intensityLoc,
      4,
      this.gl.FLOAT,
      false,
      8 * 4,
      4 * 4
    );
    this.shader.use().vec2('viewport', this.width, this.height);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.pointCount * 6);
    this.gl.disableVertexAttribArray(1);
    this.pointCount = 0;
    this.bufferIndex = 0;
    this.nodeFront.end();
    return this.gl.disable(this.gl.BLEND);
  }
};

Heights.prototype.clear = function() {
  this.nodeFront.use();
  this.gl.clearColor(0, 0, 0, 1);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  return this.nodeFront.end();
};

Heights.prototype.clamp = function(min, max) {
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.heatmap.quad);
  this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, 0, 0);
  this.nodeFront.bind(0);
  this.nodeBack.use();
  this.clampShader
    .use()
    .int('source', 0)
    .float('low', min)
    .float('high', max);
  this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  this.nodeBack.end();
  return this.swap();
};

Heights.prototype.multiply = function(value) {
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.heatmap.quad);
  this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, 0, 0);
  this.nodeFront.bind(0);
  this.nodeBack.use();
  this.multiplyShader
    .use()
    .int('source', 0)
    .float('value', value);
  this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  this.nodeBack.end();
  return this.swap();
};

Heights.prototype.blur = function() {
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.heatmap.quad);
  this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, 0, 0);
  this.nodeFront.bind(0);
  this.nodeBack.use();
  this.blurShader
    .use()
    .int('source', 0)
    .vec2('viewport', this.width, this.height);
  this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  this.nodeBack.end();
  return this.swap();
};

Heights.prototype.swap = function() {
  var tmp;
  tmp = this.nodeFront;
  this.nodeFront = this.nodeBack;
  return (this.nodeBack = tmp);
};

Heights.prototype.addVertex = function(x, y, xs, ys, intensity) {
  this.vertexBufferData[this.bufferIndex++] = x;
  this.vertexBufferData[this.bufferIndex++] = y;
  this.vertexBufferData[this.bufferIndex++] = xs;
  this.vertexBufferData[this.bufferIndex++] = ys;
  this.vertexBufferData[this.bufferIndex++] = intensity;
  this.vertexBufferData[this.bufferIndex++] = intensity;
  this.vertexBufferData[this.bufferIndex++] = intensity;
  return (this.vertexBufferData[this.bufferIndex++] = intensity);
};

Heights.prototype.addPoint = function(x, y, size, intensity) {
  var s;
  if (size == null) {
    size = 50;
  }
  if (intensity == null) {
    intensity = 0.2;
  }
  if (this.pointCount >= this.maxPointCount - 1) {
    this.update();
  }
  y = this.height - y;
  s = size / 2;
  this.addVertex(x, y, -s, -s, intensity);
  this.addVertex(x, y, +s, -s, intensity);
  this.addVertex(x, y, -s, +s, intensity);
  this.addVertex(x, y, -s, +s, intensity);
  this.addVertex(x, y, +s, -s, intensity);
  this.addVertex(x, y, +s, +s, intensity);
  return (this.pointCount += 1);
};

module.exports = Heights;
