var program;
var gl;
var shaderDir;
var baseDir;

var vaos = [];
var textures = [];

var i = 0;
var cx = 0.0, cy = 0.0, cz = 4.5;
var elev = 0.0, ang = 0.0;
var lookRadius = 10.0;

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
// var directionalLightColor = [0.0, 0.0, 0.0];

var dirLightAlpha = -utils.degToRad(60);
var dirLightBeta = -utils.degToRad(120);
// modify the light direction
var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
    Math.sin(dirLightAlpha),
    Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
];

var animationFrames;
// var directionalLight = [0,0,-1,0];

// missile position
var ax = 5.0, ay = 0.0, az = 5.0;
var cax = ax, cay = ay, caz = az;

var alpha = 0.0, beta = 0.0, r = Math.abs(cz - az), minR = 0.5;

// event handler
var mouseState = false;
var lastMouseX = -100, lastMouseY = -100;

function doMouseDown(event) {
    lastMouseX = event.pageX;
    lastMouseY = event.pageY;
    mouseState = true;
}

function doMouseUp(event) {
    lastMouseX = -100;
    lastMouseY = -100;
    mouseState = false;
}

function doMouseMove(event) {
    if (mouseState) {
        var dx = event.pageX - lastMouseX;
        var dy = lastMouseY - event.pageY;
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;

        if ((dx != 0) || (dy != 0)) {
            // ang = ang + 0.5 * dx;
            // elev = elev + 0.5 * dy;

            alpha = alpha + 0.5 * dx;
            beta = beta + 0.5 * dy;
        }
    }
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

// var mousePressed = false;
// var client = {x:0, y:0};
// function mouseSetup(canvas) {
//     window.onmousedown = function (e) {
//         mousePressed = true;
//         client.x = e.clientX;
//         client.Y = e.clientY;
//     };
//
//     window.onmousemove = function (e) {
//         if(mousePressed) {
//             deltaX =(e.clientX - client.x);
//             deltaY =(e.clientY - client.y);
//             ang += (deltaX/10.0);
//             elev += (deltaY/10.0);
//
//             console.log(deltaX, deltaY);
//             client.x = e.clientX;
//             client.y = e.clientY;
//         }
//     };
//
//     window.onmouseup = function (e) {
//         mousePressed = false;
//     }
// }

function main() {

    var lastUpdateTime = (new Date).getTime();

    var Rx = 0.0;
    var Ry = 0.0;
    var Rz = 0.0;
    var S = 1.0;

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 1.0, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    //###################################################################################
    //Here we extract the position of the vertices, the normals, the indices, and the uv coordinates
    // var pigVertices = missile.obj.getVertices();
    // var pigNormals = missile.obj.getVertexNormals();
    // var pigIndices = missile.obj.getIndices();
    // var pigTexCoords = missile.obj.getTextureCoord();
    //###################################################################################

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var textLocation = gl.getUniformLocation(program, "u_texture");
    // materialDiffColorHandle = gl.getUniformLocation(program, 'mDiffColor');
    var lightDirectionHandle = gl.getUniformLocation(program, 'lightDirection');
    var lightColorHandle = gl.getUniformLocation(program, 'lightColor');
    var normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
    var norm = gl.getAttribLocation(program, "in_norm");


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

    var frames = parabolicPathCalculator([ax, ay, az], [0.0, 0.0, -5.0], 10, 200);


    function animate() {
        var currentTime = (new Date).getTime();

        if (!frames) {
            return;
        }
        var deltaC = (30 * (currentTime - lastUpdateTime)) / 1000;
        if (/*animationFrames.length != 0 &&*/ frames.length > 0 && deltaC > .5) {
            animationIndex = (animationIndex + 1) % frames.length;
            // if (animationIndex >= frames.length) {
            //     animationIndex = frames.length - 1;
            // }
            // console.log(animationIndex)

            //     var a = 10;
            //
            //     if (animationIndex === animationFrames.length) {
            //         animationIndex = 0
            //         a = a * -1;
            //     }
            // ax += 0.0;
            // ay += animationFrames[animationIndex][1];
            // az += animationFrames[animationIndex][0];
            // rx += a;
            // ry += a;
            // rz += a;
        }
        // console.log(animationIndex , ax, ay, az);
        // console.log(animationFrames);

        // worldMatrix = utils.MakeWorld(ax, ay, az, 0, -90, 0, S);
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
                // worldMatrix = missile.worldMatrix;
                // worldMatrix = utils.MakeWorld(ax, ay, az, rx, ry, rz, 0.05);
                if (frames && frames.length > 0) {
                    worldMatrix = frames[animationIndex][0];
                    ax = frames[animationIndex][1][0];
                    ay = frames[animationIndex][1][1];
                    az = frames[animationIndex][1][2];
                    // console.log(frames[animationIndex].x)
                } else {
                    worldMatrix = utils.MakeWorld(ax, ay, az, rx, ry, rz, 0.05);
                }


                // spring-camera system
                // target coordinates
                // var nC = utils.multiplyMatrixVector(worldMatrix, [0, -5, -10, 1]);
                // // distance from target
                // console.log(nC)

            }

            cx = ax + r * Math.sin(utils.degToRad(alpha)) * Math.cos(utils.degToRad(beta));
            cz = az + r * Math.cos(utils.degToRad(alpha)) * Math.cos(utils.degToRad(beta));
            cy = ay + r * Math.sin(utils.degToRad(beta));
            var uy = 1;
            if (Math.cos(utils.degToRad(beta)) < 0) {
                uy = -1;
            }

            // var viewMatrix = utils.MakeView(cx, cy, cz, elev, ang);
            var viewMatrix = createViewMatrix([ax, ay, az], [cx, cy, cz], uy);


            var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
            var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
            // if(i === 0) {
            //
            // }
            //
            // if(i === 1) {
            //     gl.activeTexture(gl.TEXTURE0);
            //     gl.uniform1i(textLocation, textures[1]);
            // }

            var normalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
            // here when we are creating the matrix location we should consider animation
            // gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 1.0);
            // gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor);
            var lightDirMatrix = utils.invertMatrix(utils.transposeMatrix(viewMatrix));//viewMatrix;
            var lightDirectionTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(lightDirMatrix), directionalLight);
            gl.uniform3fv(lightColorHandle, directionalLightColor);
            gl.uniform3fv(lightDirectionHandle, lightDirectionTransformed);

            gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(normalMatrix));

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.uniform1i(textLocation, 0);

            gl.bindVertexArray(vaos[i]);
            if (i === 0) {
                // console.log("missile", missile.obj.getIndices().length / 3)
                gl.drawElements(gl.TRIANGLES, missile.obj.getIndices().length, gl.UNSIGNED_SHORT, 0);
            }
            if (i === 1) {
                // console.log("landscape", landscape.obj.getIndices().length / 3)
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

document.onkeypress = function (e) {

    // console.log(e.key);
    switch (e.key) {
        case 'a':
        case 'A':
            // cx -= 0.01;
            ax -= 0.01;
            break;
        case 'd':
        case 'D':
            // cx += 0.01;
            ax += 0.01;
            break;

        case 'e':
        case 'E':
            // cy -= 0.01;
            ay -= 0.01;
            break;
        case 'q':
        case 'Q':
            // cy += 0.01;
            ay += 0.01;
            break;

        case 'w':
        case 'W':
            // cz -= 0.01;
            az -= 0.01;
            break;
        case 's':
        case 'S':
            // cz += 0.01;
            az += 0.01;
            break;

        case 'r':
        case 'R':
            ang -= 1.5;
            break;
        case 't':
        case 'T':
            ang += 1.5;
            break;

        case 'z':
        case 'Z':
            elev -= 1.5;
            break;
        case 'x':
        case 'X':
            elev += 1.5;
            break;

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

};

function calculateCirclePoints(centerX, centerY, from_degree, to_degree, radius, polynom_aprrox) {
    let total_degree = to_degree - from_degree;
    let coordinates = [];
    // calculation based on the poly nom approximation
    for (i = 0; i < polynom_aprrox - 1; i++) {
        // calculate the degree between two points to connects
        let circle_degree1 = from_degree + i * total_degree / polynom_aprrox
        // let circle_degree2 = from_degree + (i+1)*total_degree/polynom_aprrox
        // the coordinate of the first points
        var x1 = radius * Math.cos(utils.degToRad(circle_degree1));
        var y1 = radius * Math.sin(utils.degToRad(circle_degree1));
        // the coordinates of the second point
        // var x2 = radius * Math.cos(circle_degree2 * Math.PI / 180);
        // var y2 = radius * Math.sin(circle_degree2 * Math.PI / 180);
        // draw a line between the two points
        coordinates.push([x1, y1]);
    }
    return coordinates
}

let mouseClickCounter = 1;
let firstx;
let firsty;
let secondx;
let secondy;

function calculateLuanchPoints() {
    let centerx = (ax - secondx) / 2;
    let centery = (ay - secondy) / 2;
    return calculateCirclePoints(centerx, centery, -90, 90, centerx, 180);

}

function get_points(x, y) {

    if (mouseClickCounter % 2 != 0) {
        ax = x / gl.canvas.width;
        ay = y / gl.canvas.height;
        animationFrames = []
    } else {
        secondx = x / gl.canvas.width;
        secondy = y / gl.canvas.height;
        animationFrames = calculateLuanchPoints()
    }
    mouseClickCounter += 1;
}

function printMousePos(event) {
    get_points(event.x, event.y)
}

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
    let mid = [(start[0] + end[0]) / 2.0, 20, (start[0] + end[0]) / 2.0];
    let p1 = [start[0], start[1] + 20, start[2]];
    let p2 = [end[0], start[1] + 20, end[2]];
    let path = [];


    let q1 = null;
    let q2 = null;
    let q3 = null;

    let pitch = 0.0;

    if(start[2] >= end[2]) {
        if(start[0] === end[0]) {
            pitch = 180.0;
        }else {
            pitch = 180 + utils.radToDeg(Math.atan((start[0] - end[0]) / (start[2] - end[2])));
        }
    } else {
        pitch = utils.radToDeg(Math.atan((start[0] - end[0]) / (start[2] - end[2])));

    }

    // if(start[0] === end[0]) {
    //     pitch = 0.0;
    //     if(start[2] === end[2]) {
    //         pitch = 180.0;
    //     }
    // } else {
    //     pitch = -utils.radToDeg(Math.atan((start[0] - end[0]) / (start[2] - end[2])));
    //     if(start[0] === end[0]) {
    //         pitch = 180.0
    //     }
    //
    // }

console.log(pitch);
    q1 = createQuaternionFromYPR(90.0, pitch, 0.0);
    q2 = createQuaternionFromYPR(0.0, pitch, 0.0);
    q3 = createQuaternionFromYPR(-90.0, pitch, 0.0);
    // if (start[0] === end[0]) {
    //     if (start[2] >= end[2]) {
    //         q1 = Quaternion.fromEuler(0.0, utils.degToRad(-90), 0);
    //         q2 = Quaternion.fromEuler(0.0, utils.degToRad(-180), 0);
    //         q3 = Quaternion.fromEuler(0.0, utils.degToRad(90), 0);
    //     } else {
    //         q1 = Quaternion.fromEuler(0.0, utils.degToRad(-90), 0);
    //         q2 = Quaternion.fromEuler(0.0, utils.degToRad(0), 0);
    //         q3 = Quaternion.fromEuler(0.0, utils.degToRad(90), 0);
    //     }
    // } else if (start[2] === end[2]) {
    //     if (start[0] > end[0]) {
    //         q1 = Quaternion.fromEuler(utils.degToRad(90), utils.degToRad(-90), utils.degToRad(90));
    //         q2 = Quaternion.fromEuler(utils.degToRad(90), utils.degToRad(-180), utils.degToRad(90));
    //         q3 = Quaternion.fromEuler(utils.degToRad(90), utils.degToRad(90), utils.degToRad(90));
    //     } else {
    //         q1 = Quaternion.fromEuler(0.0, utils.degToRad(-90), 0);
    //         q2 = Quaternion.fromEuler(0.0, utils.degToRad(0), 0);
    //         q3 = Quaternion.fromEuler(0.0, utils.degToRad(90), 0);
    //     }
    //
    // } else {
    //     q1 = Quaternion.fromEuler(0.0, utils.degToRad(-90), 0);
    //     q2 = Quaternion.fromEuler(0.0, utils.degToRad(-180), 0);
    //     q3 = Quaternion.fromEuler(0.0, utils.degToRad(90), 0);
    // }


    // if(end[2] >= start[2]) {
    //     xxx = 0;
    //     ttt = -ttt;
    // }
    // console.log(xxx)
    // for (let i= 0; i< 20; i++) {
    //     path.push([utils.MakeWorld(start[0],start[1] + i + 1,start[2],0,-90,0, s), [start[0],start[1] + i + 1,start[2]]])
    // }

    // let q1 = Quaternion.fromAxisAngle([1,0,0], utils.degToRad(-90))
    // let q2 = Quaternion.fromAxisAngle([1,0,0], utils.degToRad(-180))
    // let q3 = Quaternion.fromAxisAngle([1,0,0], utils.degToRad(90))

    // Quaternion.fromEuler(Φ, θ, ψ[, order="ZXY"])
    // let q1 = Quaternion.fromEuler(utils.degToRad(0), utils.degToRad(-90), 0);
    // let q2 = Quaternion.fromEuler(utils.degToRad(0), utils.degToRad(teta), -phsi);
    // let q3 = Quaternion.fromEuler(utils.degToRad(0), utils.degToRad(90), 0);
    // let q4 = Quaternion.fromEuler(utils.degToRad(0),utils.degToRad(90),utils.degToRad(0));


    for (i = 0; i <= steps; i++) {
        let alp = i * 1.0 / steps;
        let q12 = q1.slerp(q2)(alp);
        let q23 = q2.slerp(q3)(alp);
        // let q34 = q3.slerp(q4)(alp);

        let q123 = q12.slerp(q23)(alp);
        // let q234 = q23.slerp(q34)(alp);

        // let q1234 = q123.slerp(q234)(alp);

        let MR = q123.toMatrix4();
        // let MR = q1234.toMatrix4();


        let uma = 1.0 - alp;
        let c0 = uma * uma;
        let c1 = uma * alp;
        let c2 = alp * alp;
        // let c3 = alp * alp * alp;

        // let translate = [
        //     start[0] * c0 + p1[0] * c1 + p2[0] * c2 + end[0] * c3,
        //     start[1] * c0 + p1[1] * c1 + p2[1] * c2 + end[1] * c3,
        //     start[2] * c0 + p1[2] * c1 + p2[2] * c2 + end[2] * c3,
        // ]

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

        // console.log(q123);

        // console.log(MT)

        path.push([utils.multiplyMatrices(utils.multiplyMatrices(MT, MR), utils.MakeScaleMatrix(s)), translate])
    }

    // for (let i= 0; i<20; i++) {
    //     path.push([utils.MakeWorld(end[0],p2[1] - (i +1),end[2],0,90,0, s), [end[0],p2[1] -(i+1),end[2]]])
    // }

    return path

    // let deltaT = duration * 1.0 / steps; // diff time between each step
    // let vy = (duration / 2.0) * g * s; // speed in y-axis (height)
    // let vx = (end[0] - start[0]) * s / duration;  // speed in x-axis
    // let vz = (end[2] - start[2]) * s / duration;  // speed in z-axis

    // let q1 = Quaternion.fromAxisAngle([0,1,0], utils.degToRad(90));
    // let q2 = Quaternion.fromAxisAngle([0,1,0], utils.degToRad(90));
    // console.log(q1)
    // console.log(q2)
    // console.log()
    // var aj = q1.slerp(q2)(0.5).toMatrix4();
    // console.log(utils.multiplyMatrices(utils.MakeTranslateMatrix(start[0], start), aj))


    // console.log(deltaT, vx, vy, vz);
    //
    // let path = [];
    // path.push(start);
    // for (let i= 1; i <= steps; i++) {
    //     path[i] = [
    //         path[i-1][0] + (vx * deltaT) ,
    //         path[i-1][1] + (vy * deltaT) ,
    //         path[i-1][2] + (vz * deltaT) ,
    //     ];
    //     vy -= g * deltaT * s;
    //     console.log(vy);
    // }
    // path.push(end);
    // return path;
}

function createQuaternionFromYPR(yaw, pitch, roll){
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

    return  new Quaternion(qx, qy, qz, qw);
}

document.addEventListener("click", printMousePos);

// temp = parabolicPathCalculator([0,0,0], [10,0,10], 10, 10);
// console.log(temp);