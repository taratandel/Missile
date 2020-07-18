var program;
var gl;
var shaderDir;
var baseDir;

var vaos = [];
var textures = [];

var i = 0;
var cx = 0.0, cy = 0.0, cz = 4.5, elev = 0.0, ang = 0.0;
var lookRadius = 10.0;

var isLookAtCamera = true;

var rx = 0.0, ry = -90.0, rz = 0.0;
var missile = {
    objPath: 'Models/Missile2/R73-Ready.obj',
    texturePath: 'Models/Missile2/R73_Texture.png',
    worldMatrix: utils.MakeWorld(0.0, 0.0, 4.5, 0.0, -90.0, 0.0, 0.05),
    obj: null,
    texture: null,
};

var landscape = {
    objPath: 'Models/Landscape/mount.obj',
    texturePath: 'Models/Landscape/ground_grass_3264_4062_Small.jpg',
    worldMatrix: utils.MakeWorld(0.0, -1.0, 0.0, 0.0, 0.0, 0.0, 1.0),
    obj: null,
    texture: null,
};

var directionalLightColor = [0.1, 0.1, 0.10];

var dirLightAlpha = -utils.degToRad(60);
var dirLightBeta = -utils.degToRad(120);
// modify the light direction
var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
    Math.sin(dirLightAlpha),
    Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
];



// missile position
var ax = 5.0, ay = 0.0, az = 5.0;
var frames, frames_to_start;
var alpha = 0.0, beta = 0.0, r = Math.abs(cz - az), minR = 0.5;

// event handler
var mouseState = false;
var lastMouseX = -100, lastMouseY = -100;

function doMouseDown(event) {
    lastMouseX = event.pageX;
    lastMouseY = event.pageY;
    mouseState = true;
    console.log("mousedown")
}

function doMouseUp(event) {
    lastMouseX = -100;
    lastMouseY = -100;
    mouseState = false;
    console.log("mouseup")

}

function doMouseMove(event) {
    if (mouseState) {
        let dx = event.pageX - lastMouseX;
        let dy = lastMouseY - event.pageY;
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;

        if ((dx != 0) || (dy != 0)) {

            if (isLookAtCamera) {
                alpha = alpha + 0.5 * dx;
                beta = beta + 0.5 * dy;
            } else {
                ang = ang + 0.5 * dx;
                elev = elev + 0.5 * dy;
            }
        }
    }
    console.log("mousemove")
}

function doMouseWheel(event) {
    var nLookRadius = lookRadius + event.wheelDelta / 1000.0;
    if ((nLookRadius > 2.0) && (nLookRadius < 20.0)) {
        lookRadius = nLookRadius;
    }
}


function createViewMatrix(objPosition, camPosition, uy) {
    let c = camPosition;
    let a = objPosition;
    let u = [0, uy, 0];

    let vzn = utils.subtractVector3(c, a);
    vzn = utils.normalizeVector3(vzn);

    let vxn = utils.crossVector(u, vzn);
    vxn = utils.normalizeVector3(vxn);

    let vy = utils.crossVector(vzn, vxn);

    var Mc = [vxn[0], vy[0], vzn[0], c[0],
        vxn[1], vy[1], vzn[1], c[1],
        vxn[2], vy[2], vzn[2], c[2],
        0, 0, 0, 1];

    return utils.invertMatrix(Mc);
}

function main() {

    var lastUpdateTime = (new Date).getTime();

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 1.0, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);


    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var textLocation = gl.getUniformLocation(program, "u_texture");
    var lightDirectionHandle = gl.getUniformLocation(program, 'lightDirection');
    var lightColorHandle = gl.getUniformLocation(program, 'lightColor');
    var normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
    var norm = gl.getAttribLocation(program, "in_norm");
    for(var i = 0; i < unifParArray.length; i++) {
        program[unifParArray[i].pGLSL+"Uniform"] = gl.getUniformLocation(program, unifParArray[i].pGLSL);
    }

    var perspectiveMatrix = utils.MakePerspective(70, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    gl.enable(gl.DEPTH_TEST)

    // bind missile to its array
    vaos[0] = gl.createVertexArray();
    gl.bindVertexArray(vaos[0]);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(missile.obj.getVertices()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(missile.obj.getTextureCoord()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(missile.obj.getIndices()), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(missile.obj.getVertexNormals()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(norm);
    gl.vertexAttribPointer(norm, 3, gl.FLOAT, false, 0, 0);

    textures[0] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textures[0]);

    var image2 = new Image();
    image2.src = baseDir + missile.texturePath;
    image2.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, textures[0]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image2);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    };


    // bind mount to its array
    vaos[1] = gl.createVertexArray();
    gl.bindVertexArray(vaos[1]);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(landscape.obj.getVertices()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(landscape.obj.getTextureCoord()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(landscape.obj.getIndices()), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(landscape.obj.getVertexNormals()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(norm);
    gl.vertexAttribPointer(norm, 3, gl.FLOAT, false, 0, 0);


    textures[1] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textures[1]);

    var image = new Image();
    image.src = baseDir + landscape.texturePath;
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, textures[1]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    var animationIndex = 0;
    drawScene();


    var frames = parabolicPathCalculator([ax, ay, az], [0.0, 0.0, -10.0], 10, 200);


    function animate() {
        var currentTime = (new Date).getTime();

        if (!frames) {
            return;
        }
        var deltaC = (30 * (currentTime - lastUpdateTime)) / 1000;
        if ( frames.length > 0 && deltaC > .5 && animationIndex + 1 != frames.length) {
            should_animate = 2
            animationIndex = (animationIndex + 1) ;
        } else if (animationIndex + 1 == frames.length) {
            should_animate = 1
            animationIndex = -1
            frames = []
        }
        lastUpdateTime = currentTime;
    }

    function drawScene() {
        animate();

        utils.resizeCanvasToDisplaySize(gl.canvas);
        gl.clearColor(36 / 255, 206 / 255, 1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < 2; i++) {
            if (i === 1) {
                worldMatrix = landscape.worldMatrix;
            }

            if (i === 0) {

                if (frames && frames.length > 0 && animationIndex + 1 > 0) {
                    console.log("it's channig the ax")
                    worldMatrix = frames[animationIndex][0];
                    ax = frames[animationIndex][1][0];
                    ay = frames[animationIndex][1][1];
                    az = frames[animationIndex][1][2];
                    // console.log(frames[animationIndex].x)
                } else {
                    worldMatrix = utils.MakeWorld(ax, ay, az, rx, ry, rz, 0.05);
                }

            }

            // make the camera view
            var viewMatrix = null;
            if (isLookAtCamera) {
                cx = ax + r * Math.sin(utils.degToRad(alpha)) * Math.cos(utils.degToRad(beta));
                cz = az + r * Math.cos(utils.degToRad(alpha)) * Math.cos(utils.degToRad(beta));
                cy = ay + r * Math.sin(utils.degToRad(beta));
                var uy = 1;
                if (Math.cos(utils.degToRad(beta)) < 0) {
                    uy = -1;
                }

                viewMatrix = createViewMatrix([ax, ay, az], [cx, cy, cz], uy);
            } else {
                viewMatrix = utils.MakeView(cx, cy, cz, elev, ang);
            }


            var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
            var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

            var normalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
            // here when we are creating the matrix location we should consider animation
            var lightDirMatrix = utils.invertMatrix(utils.transposeMatrix(viewMatrix));//viewMatrix;
            var lightDirectionTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(lightDirMatrix), directionalLight);
            gl.uniform3fv(lightColorHandle, directionalLightColor);
            gl.uniform3fv(lightDirectionHandle, lightDirectionTransformed);

            gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(normalMatrix));
            for(var uniformArrayIndex = 0; uniformArrayIndex < unifParArray.length; uniformArrayIndex++) {
                unifParArray[uniformArrayIndex].type(gl);
            }
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.uniform1i(textLocation, 0);

            gl.bindVertexArray(vaos[i]);
            if (i === 0) {
                gl.drawElements(gl.TRIANGLES, missile.obj.getIndices().length, gl.UNSIGNED_SHORT, 0);
            }
            if (i === 1) {
                gl.drawElements(gl.TRIANGLES, landscape.obj.getIndices().length, gl.UNSIGNED_SHORT, 0);
            }

        }

        window.requestAnimationFrame(drawScene);
    }
}

async function init() {

    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir + "shaders/";

    var canvas = document.getElementById("my-canvas");
    canvas.addEventListener("mousedown", doMouseDown, false);
    canvas.addEventListener("mouseup", doMouseUp, false);
    canvas.addEventListener("mousemove", doMouseMove, false);
    canvas.addEventListener("mousewheel", doMouseWheel, false);
    // document.addEventListener("click", startAnimation);

    gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }

    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);

    });
    gl.useProgram(program);

    //###################################################################################
    //This loads the obj models
    missile.obj = new Model(baseDir + missile.objPath);
    await missile.obj.initModel();

    landscape.obj = new Model(baseDir + landscape.objPath);
    await landscape.obj.initModel();
    //###################################################################################

    main();
}

window.onload = init;

document.onkeypress = function (e) {

    // console.log(e.key);
    if (!isLookAtCamera) {
        let moveSpeed = 0.1;
        let radAng = utils.degToRad(ang);
        switch (e.key) {
            // camera move forward
            case 'w':
            case 'W':
                cz -= moveSpeed * Math.cos(radAng);
                cx += moveSpeed * Math.sin(radAng);
                break;

            // camera move backward
            case 's':
            case 'S':
                cz += moveSpeed * Math.cos(radAng);
                cx -= moveSpeed * Math.sin(radAng);
                break;

            // camera move left
            case 'a':
            case 'A':
                cz -= moveSpeed * Math.sin(radAng);
                cx -= moveSpeed * Math.cos(radAng);
                break;

            // camera move right
            case 'd':
            case 'D':
                cz += moveSpeed * Math.sin(radAng);
                cx += moveSpeed * Math.cos(radAng);
                break;

            // camera move up
            case 'e':
            case 'E':
                cy -= moveSpeed;
                // ay -= 0.01;
                break;

            // camera move down
            case 'q':
            case 'Q':
                cy += moveSpeed;
                // ay += 0.01;
                break;
        }
    } else {
        switch (e.key) {
            case '+':
                r -= 0.1;
                if (r < minR) {
                    r += 0.1
                }
                break;

            case '-':
                r += 0.1;
                break
        }
    }

};

/**
 *
 * @param start point [x,y,z]
 * @param end point [x,y,z]
 * @param duration total animation duration
 * @param steps how many point we must calculate
 * @param g the gravity
 * @param s scale
 */
function parabolicPathCalculator(start, end, duration, steps, s = 0.05, g = 1.0) {
    let mid = [(start[0] + end[0]) / 2.0, 20, (start[2] + end[2]) / 2.0];

    let path = [];


    let q1 = null;
    let q2 = null;
    let q3 = null;

    let pitch = 0.0;

    if (start[2] >= end[2]) {
        if (start[0] === end[0]) {
            pitch = 180.0;
        } else {
            pitch = 180 + utils.radToDeg(Math.atan((start[0] - end[0]) / (start[2] - end[2])));
        }
    } else {
        pitch = utils.radToDeg(Math.atan((start[0] - end[0]) / (start[2] - end[2])));

    }
    q1 = createQuaternionFromYPR(90.0, pitch, 0.0);
    q2 = createQuaternionFromYPR(0.0, pitch, 0.0);
    q3 = createQuaternionFromYPR(-90.0, pitch, 0.0);


    for (i = 0; i <= steps; i++) {
        let alp = i * 1.0 / steps;
        let q12 = q1.slerp(q2)(alp);
        let q23 = q2.slerp(q3)(alp);

        let q123 = q12.slerp(q23)(alp);

        let MR = q123.toMatrix4();

        let uma = 1.0 - alp;
        let c0 = uma * uma;
        let c1 = uma * alp;
        let c2 = alp * alp;

        let translate = [
            start[0] * c0 + mid[0] * c1 + end[0] * c2,
            start[1] * c0 + mid[1] * c1 + end[1] * c2,
            start[2] * c0 + mid[2] * c1 + end[2] * c2,
        ]

        let MT = utils.MakeTranslateMatrix(
            start[0] * c0 + mid[0] * c1 + end[0] * c2,
            start[1] * c0 + mid[1] * c1 + end[1] * c2,
            start[2] * c0 + mid[2] * c1 + end[2] * c2,
        );


        path.push([utils.multiplyMatrices(utils.multiplyMatrices(MT, MR), utils.MakeScaleMatrix(s)), translate])
    }

    return path
}

function createQuaternionFromYPR(yaw, pitch, roll) {
    let yc = Math.cos(utils.degToRad(yaw * 0.5));
    let ys = Math.sin(utils.degToRad(yaw * 0.5));
    let pc = Math.cos(utils.degToRad(pitch * 0.5));
    let ps = Math.sin(utils.degToRad(pitch * 0.5));
    let rc = Math.cos(utils.degToRad(roll * 0.5));
    let rs = Math.sin(utils.degToRad(roll * 0.5));

    let qw = rc * pc * yc + rs * ps * ys;
    let qx = rs * pc * yc - rc * ps * ys;
    let qy = rc * ps * yc + rs * pc * ys;
    let qz = rc * pc * ys - rs * ps * yc;

    return new Quaternion(qx, qy, qz, qw);
}
let should_animate = 1;
function startAnimation(event) {
    let mousePisitionX;
    let mousePisitionY;
    mousePisitionX = gl.canvas.width/event.pageX;
    mousePisitionY = gl.canvas.height/event.pageY;
    if (should_animate == 0) {
        frames_to_start = parabolicPathCalculator([ax, ay, az], [mousePisitionX, ay, mousePisitionY], 10, 200);
    } else if (should_animate == 1){
        ax = mousePisitionX;
        ay = mousePisitionY;
        az = az;
        should_animate = 0;
    }
    console.log("mouseclicl");
}

function setIsLookAtCamera(state) {
    isLookAtCamera = state;
    if(!isLookAtCamera) {
        ang = -alpha;
        elev = -beta;
    }
}
// document.addEventListener("click", printMousePos);

// can be [1,0,0,0] for direct or [0,1,0,0] for point
let lightType = [1,0,0,0];
//each element can be between -250 till 250 we have this for point
let lightPositionX = 0;
let lightPositionY = 0;
let lightPositionZ = 0;

// can be between -180 til 180 we have this for direct
let lightDirTheta = 90;
let lightDirPhi = 90;

// Decay factor can be between 0,2
let lightDecay = [2,0];

// for light color any hex value which is string is acceptable
//be careful we are using in different places the value of this color that is why the color
//is so dense take a look at prof coding everything will be more clear this color is for now

let lightsColor = "ffffff";
function unifPar(pHTML, pGLSL, type) {
    this.pHTML = pHTML;
    this.pGLSL = pGLSL;
    this.type = type;
}
function valType(gl) {
    let v = lightType;
    gl.uniform4f(program[this.pGLSL+"Uniform"], v[0], v[1], v[2], v[3]);
}
function valVec3(gl) {
    gl.uniform3f(program[this.pGLSL+"Uniform"],
        lightPositionX,
        lightPositionY,
        lightPositionZ)
}
function valDir(gl) {
    let t = utils.degToRad(lightDirTheta);
    let p = utils.degToRad(lightDirPhi);
    gl.uniform3f(program[this.pGLSL+"Uniform"],Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p));
}

function val(gl) {
    gl.uniform1f(program[this.pGLSL+"Uniform"], lightDecay);
}

function valCol(gl) {
    let col = lightsColor;
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
    new unifPar("LBlightColor","LBlightColor", valCol),

    new unifPar("ambientLightColor","ambientLightColor", valCol),
    new unifPar("diffuseColor","diffuseColor", valCol),
    new unifPar("specularColor","specularColor", valCol),
    new unifPar("ambientMatColor","ambientMatColor", valCol),
];

function setLightsColor(color) {
    lightsColor = color.substr(1);
}