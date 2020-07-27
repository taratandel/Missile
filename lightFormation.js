// can be [1,0,0,0] for direct or [0,1,0,0] for point
let lightType = [[1,0,0,0], [0,0,0,0]];
//each element can be between -250 till 250 we have this for point
let lightPositionX = [0,0];
let lightPositionY = [0,0];
let lightPositionZ = [0,0];

// can be between -180 til 180 we have this for direct
let lightDirTheta = [90,90];
let lightDirPhi = [90,90];

// Decay factor can be between 0,2
let lightDecay = [0,0];

// for light color any hex value which is string is acceptable
//be careful we are using in different places the value of this color that is why the color
//is so dense take a look at prof coding everything will be more clear this color is for now

let lightsColor = ["ffffff","ffffff"];
let ambientLightColor = "ffffff";
let diffuseColor = "ffffff";
let specularColor = "ffffff";
let ambientMatColor = "ffffff";


let SpecShine = 200;
function unifPar(pHTML, pGLSL, type) {
    this.pHTML = pHTML;
    this.pGLSL = pGLSL;
    this.type = type;
}
function valType(gl) {
    let v = []
    if (this.pHTML == "LBlightType") {
        v = lightType[1];
    } else {
        v = lightType[0];
    }

    gl.uniform4f(program[this.pGLSL+"Uniform"], v[0], v[1], v[2], v[3]);
}
function valVec3(gl) {
    let lightPositionXs;
    let lightPositionYs;
    let lightPositionZs;
    if (this.pHTML == "LBPos") {
        lightPositionXs = lightPositionX[1];
        lightPositionYs = lightPositionY[1];
        lightPositionZs = lightPositionZ[1];
    } else {
        lightPositionXs = lightPositionX[0];
        lightPositionYs = lightPositionY[0];
        lightPositionZs = lightPositionZ[0];
    }
    let pointLight = [lightPositionXs, lightPositionYs, lightPositionZs]
    // translate to camera space
    //they are usually expressed in the world space
    // we have scaling so we need inverse transpose
    // the light is not changing so we do it once
    // we just pass the transformed light
    let lightPosMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
    let lightPositionTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(lightPosMatrix),pointLight);
    gl.uniform3fv(program[this.pGLSL+"Uniform"],
        lightPositionTransformed)
}
function valDir(gl) {
    let t;
    let p;
    if (this.pHTML == "LBDir") {

        t = utils.degToRad(lightDirTheta[1]);
        p = utils.degToRad(lightDirPhi[1]);
    } else  {
        t = utils.degToRad(lightDirTheta[0]);
        p = utils.degToRad(lightDirPhi[0]);
    }    let directionalLight = [Math.sin(t)*Math.sin(p),
        Math.cos(t),
        Math.sin(t)*Math.cos(p)
    ];

    // translate to camera space
    //they are usually expressed in the world space
    // we have scaling so we need inverse transpose
    // the light is not changing so we do it once
    // we just pass the transformed light
    let lightDirMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
    let lightDirectionTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(lightDirMatrix),directionalLight);

    gl.uniform3fv(program[this.pGLSL+"Uniform"],lightDirectionTransformed);
}

function val(gl) {
    let value;
    if (this.pHTML == "LBDecay") {
        value = lightDecay[1];

    } else if (this.pHTML == "LADecay") {
        value = lightDecay[0];
    } else {
        value = SpecShine
    }

    gl.uniform1f(program[this.pGLSL+"Uniform"], value);
}

function valCol(gl) {
    let lightColor = "fffffff";
    if (this.pHTML == "LBlightColor"){
        lightColor = lightsColor[1];

    } else if (this.pHTML == "LAlightColor") {
        lightColor = lightsColor[0];
    }else if (this.pHTML == "ambientLightColor") {
        lightColor = ambientLightColor;
    } else if (this.pHTML == "diffuseColor") {
        lightColor = diffuseColor;
    } else if (this.pHTML == "specularColor")
    {
        lightColor = specularColor;
    } else {
        lightColor = ambientMatColor;
    }
    let col = lightColor;
    let R = parseInt(col.substring(0,2) ,16) / 255;
    let G = parseInt(col.substring(2,4) ,16) / 255;
    let B = parseInt(col.substring(4,6) ,16) / 255;
    gl.uniform4f(program[this.pGLSL+"Uniform"], R, G, B, 1);
}

unifParArray =[

    new unifPar("LAlightType","LAlightType", valType),
    new unifPar("LAPos","LAPos", valVec3),
    new unifPar("LADir","LADir", valDir),
    new unifPar("LADecay","LADecay", val),
    new unifPar("LAlightColor","LAlightColor", valCol),

    new unifPar("LBlightType","LBlightType", valType),
    new unifPar("LBPos","LBPos", valVec3),
    new unifPar("LBDir","LBDir", valDir),
    new unifPar("LADecay","LADecay", val),
    new unifPar("LBlightColor","LBlightColor", valCol),

    new unifPar("ambientLightColor","ambientLightColor", valCol),
    new unifPar("diffuseColor","diffuseColor", valCol),
    new unifPar("specularColor","specularColor", valCol),
    new unifPar("ambientMatColor","ambientMatColor", valCol),
    new unifPar("SpecShine","SpecShine", val),
];
