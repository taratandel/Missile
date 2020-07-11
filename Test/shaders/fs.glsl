#version 300 es

precision mediump float;

in vec3 fs_pos;
in vec3 fs_norm;
in vec2 fs_uv;

uniform sampler2D u_texture;
uniform vec3 lightDirection;
uniform vec3 lightColor;

out vec4 outColor;

void main() {
  vec3 nNormal = normalize(fs_norm);
  vec4 texcol = texture(u_texture, fs_uv);
  vec3 lDir = lightDirection;
  vec3 lambertColor =  lightColor * dot(-lDir,nNormal);
  outColor = vec4(texcol.rgb , texcol.a) + vec4(clamp(lambertColor, 0.0, 1.0), 1.0);
}