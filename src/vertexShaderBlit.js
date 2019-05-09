var vertexShaderBlit = 'attribute vec4 position;\nvarying vec2 texcoord;\nvoid main(){\n    texcoord = position.xy*0.5+0.5;\n    gl_Position = position;\n}';

module.exports = vertexShaderBlit;
