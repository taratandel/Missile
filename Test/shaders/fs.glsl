#version 300 es

precision highp float;

in vec3 fs_pos;
in vec3 fs_norm;
in vec2 fs_uv;

uniform sampler2D u_texture;
uniform vec4 lightDir;

out vec4 outColor;

void main() {
  vec4 texcol = texture(u_texture, fs_uv);
  float ambFact = lightDir.w;
  float dimFact = (1.0-ambFact) * clamp(dot(normalize(fs_norm), lightDir.xyz),0.0,1.0) + ambFact;
  outColor = vec4(texcol.rgb , texcol.a);
  // outColor = texture(u_texture, fs_uv);
}