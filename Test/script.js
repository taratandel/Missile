// initializers
let program;
let gl;
let shaderDir;
let baseDir;
// vertices and texture
let vaos = [];
let textures = [];


// camera positions
let cx = 0.02, cy = 0.13, cz = 4.3, elev = 0.0, ang = 0.0;
let lookRadius = 10.0;

let isLookAtCamera = true;
let animationIndex = 0;

let rx = 0.0, ry = -90.0, rz = 0.0;
let missile = {
    objPath: 'Models/Missile2/R73-Ready.obj',
    texturePath: 'Models/Missile2/R73_Texture.png',
    scale: 0.02,
    worldMatrix: utils.MakeWorld(0.0, 0.0, 4.5, 0.0, -90.0, 0.0, self.scale),
    obj: null,
    texture: null,
};

let landscape = {
    objPath: 'Models/Landscape/mount.obj',
    texturePath: 'Models/Landscape/ground_grass_3264_4062_Small.jpg',
    worldMatrix: utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0),
    obj: null,
    texture: null,
};




// missile position
let ax = 0.0, ay = 0.102, az = 4.1;
let frames, frames_to_start;
let alpha = 0.0, beta = 0.0, r = Math.abs(cz - az), minR = 0.2;

// event handler
let mouseState = false;
let lastMouseX = -100, lastMouseY = -100;

//animation
let should_animate = false;




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

    let lastUpdateTime = (new Date).getTime();

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 1.0, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);


    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    let uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    let matrixLocation = gl.getUniformLocation(program, "matrix");
    let textLocation = gl.getUniformLocation(program, "u_texture");
    let normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
    let norm = gl.getAttribLocation(program, "in_norm");
    for(let unifArrayIndex = 0; unifArrayIndex < unifParArray.length; unifArrayIndex++) {
        program[unifParArray[unifArrayIndex].pGLSL+"Uniform"] = gl.getUniformLocation(program, unifParArray[unifArrayIndex].pGLSL);
    }

    let perspectiveMatrix = utils.MakePerspective(70, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
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
    drawScene();


    frames = parabolicPathCalculator([ax, ay, az], [1.28, 1.76, -0.35], 10, 200);


    function animate() {
        var currentTime = (new Date).getTime();

        if (!frames) {
            return;
        }
        let deltaC = (30 * (currentTime - lastUpdateTime)) / 1000;
        if(should_animate) {
            if (frames.length > 0 && deltaC > .5 && animationIndex + 1 !== frames.length) {
                animationIndex = (animationIndex + 1);
            } else if (animationIndex + 1 === frames.length) {
                should_animate = false;
                pauseAnimationChange();
            }
        }
        lastUpdateTime = currentTime;
    }

    function drawScene() {
        animate();
        let worldMatrix;
        utils.resizeCanvasToDisplaySize(gl.canvas);
        gl.clearColor(36 / 255, 206 / 255, 1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < 2; i++) {
            if (i === 1) {
                worldMatrix = landscape.worldMatrix;

            }
            if (i === 0) {

                if (frames && frames.length > 0 && animationIndex + 1 > 0) {
                    worldMatrix = frames[animationIndex][0];
                    ax = frames[animationIndex][1][0];
                    ay = frames[animationIndex][1][1];
                    az = frames[animationIndex][1][2];
                } else {
                    worldMatrix = utils.MakeWorld(ax, ay, az, rx, ry, rz, missile.scale);
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
    let mid = [(start[0] + end[0]) / 2.0, 10, (start[2] + end[2]) / 2.0];

    let path = [];


    let q1;
    let q2;
    let q3;

    let pitch;

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


    for (let i = 0; i <= steps; i++) {
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


        path.push([utils.multiplyMatrices(utils.multiplyMatrices(MT, MR), utils.MakeScaleMatrix(missile.scale)), translate])
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


function setIsLookAtCamera(state) {
    isLookAtCamera = state;
    if(!isLookAtCamera) {
        ang = -alpha;
        elev = -beta;
    }
}
