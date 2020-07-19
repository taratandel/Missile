#version 300 es
precision mediump float;

in vec3 fs_pos;
in vec3 fs_norm;
in vec2 fs_uv;

uniform sampler2D u_texture;

uniform vec3 eyePos;

uniform vec4 LAlightType;
uniform vec3 LAPos;
uniform vec3 LADir;
uniform vec4 LAlightColor;
uniform float LADecay;


uniform vec4 LBlightType;
uniform vec3 LBPos;
uniform vec3 LBDir;
uniform vec4 LBlightColor;
uniform float LBDecay;


uniform vec4 ambientLightColor;
uniform vec4 diffuseColor;
uniform vec4 specularColor;
uniform vec4 ambientMatColor;


vec3 compLightDir(vec3 LPos, vec3 LDir, vec4 lightType) {
  //lights
  // -> Point
  vec3 pointLightDir = normalize(LPos - fs_pos);
  // -> Direct
  vec3 directLightDir = LDir;


  return            directLightDir * lightType.x +
  pointLightDir * lightType.y;
}

vec4 compLightColor(vec4 lightColor, float LDecay, vec3 LPos, vec3 LDir, vec4 lightType) {

  //lights
  // -> Point
  vec4 pointLightCol = lightColor;
  // -> Direct
  vec4 directLightCol = lightColor;

  // ----> Select final component
  return          directLightCol * lightType.x +
  pointLightCol * lightType.y;
}

vec4 compDiffuse(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec4 diffColor, vec3 eyedirVec) {
  // Diffuse
  float LdotN = max(0.0, dot(normalVec, lightDir));
  vec4 LDcol = lightCol * diffColor;
  // --> Lambert
  vec4 diffuseLambert = LDcol * LdotN;

  // ----> Select final component
  return         diffuseLambert;
}

vec4 compSpecular(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec3 eyedirVec) {
  // Specular
  float LdotN = max(0.0, dot(normalVec, lightDir));
  vec3 reflection = -reflect(lightDir, normalVec);
  float LdotR = max(dot(reflection, eyedirVec), 0.0);
  vec3 halfVec = normalize(lightDir + eyedirVec);
  float HdotN = max(dot(normalVec, halfVec), 0.0);

  vec4 LScol = lightCol * specularColor * max(sign(LdotN),0.0);
  // --> Phong
  vec4 specularPhong = LScol * pow(LdotR, 100.0);

  // ----> Select final component
  return          specularPhong ;
}

vec4 compAmbient(vec4 ambColor, vec3 normalVec) {
  // Ambient
  // --> Ambient
  vec4 ambientAmbient = ambientLightColor * ambColor;

  return 		   ambientAmbient;
}

out vec4 outColor;

void main() {
  vec4 texcol = texture(u_texture, fs_uv);

  vec4 diffColor = diffuseColor  * 0.001 + texcol * 0.999;
  vec4 ambColor = ambientMatColor * 0.001 + texcol * 0.999;

  vec3 normalVec = normalize(fs_norm);
  vec3 eyedirVec = normalize(eyePos - fs_pos);

  //lights
  vec3 LAlightDir = compLightDir(LAPos, LADir, LAlightType);
  vec4 LAlightCol = compLightColor(LAlightColor,  LADecay, LAPos, LADir, LAlightType);

  vec3 LBlightDir = compLightDir(LBPos, LBDir, LBlightType);
  vec4 LBlightCol = compLightColor(LBlightColor, LBDecay, LBPos, LBDir, LBlightType);

  // Diffuse
  vec4 diffuse = compDiffuse(LAlightDir, LAlightCol, normalVec, diffColor, eyedirVec) +
  compDiffuse(LBlightDir, LBlightCol, normalVec, diffColor, eyedirVec) ;

  // Specular
  vec4 specular = compSpecular(LAlightDir, LAlightCol, normalVec, eyedirVec) +
  compSpecular(LBlightDir, LBlightCol, normalVec, eyedirVec);

  // Ambient
  vec4 ambient = compAmbient(ambColor, normalVec);

  // final steps
  vec4 out_color = clamp(ambient + diffuse + specular , 0.0, 1.0);

  outColor = vec4(out_color.rgb, 1.0);
}