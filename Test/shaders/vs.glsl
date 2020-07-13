#version 300 es
#define POSITION_LOCATION 0
#define NORMAL_LOCATION 1
#define UV_LOCATION 2

layout(location = POSITION_LOCATION) in vec3 a_position;
layout(location = NORMAL_LOCATION) in vec3 in_norm;
layout(location = UV_LOCATION) in vec2 a_uv;

//out vec3 fs_pos;
out vec3 fs_norm;
out vec2 fs_uv;

uniform mat4 matrix;
uniform mat4 nMatrix;     //matrix to transform normals
void main() {
//  fs_pos = a_position;
  fs_uv = vec2(a_uv.x, a_uv.y);
  fs_norm = mat3(nMatrix) * in_norm;
  gl_Position = matrix * vec4(a_position, 1.0);
}
