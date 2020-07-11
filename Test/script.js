var program;
var gl;
var shaderDir;
var baseDir;
var pigModel;
// var modelStr = ;
// var modelTexture = ;

var vaos = [];
var textures = [];


var cx = 0.0, cy = 0.0, cz = 6.0;
var elev = 0.0, ang = 0.0;

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

var directionalLightColor = [0.4, 0.3, 0.10];

var dirLightAlpha = -utils.degToRad(60);
var dirLightBeta  = -utils.degToRad(120);
// modify the light direction
var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
    Math.sin(dirLightAlpha),
    Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
];
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

    var normalBuffer = gl.createBuffer()
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

    var normalBuffer = gl.createBuffer()
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

    function animate() {
        var currentTime = (new Date).getTime();
        if (lastUpdateTime != null) {
            var deltaC = (30 * (currentTime - lastUpdateTime)) / 1000.0;
            Rx += deltaC;
            Ry -= deltaC;
            Rz += deltaC;
        }
        worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, Rx, Ry, Rz, S);
        lastUpdateTime = currentTime;
    }

    function drawScene() {
        // animate();
        utils.resizeCanvasToDisplaySize(gl.canvas);
        gl.clearColor(0.85, 0.85, 0.85, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < 2; i++) {
            if (i === 1) {
                worldMatrix = landscape.worldMatrix;
            }

            if (i === 0) {
                worldMatrix = missile.worldMatrix;
            }

            var viewMatrix = utils.MakeView(cx, cy, cz, elev, ang);


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

            var normalMatrix =  utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
            // here when we are creating the matrix location we should consider animation
            // gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 1.0);
            // gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor);
            var lightDirMatrix = utils.invertMatrix(utils.transposeMatrix(viewMatrix));//viewMatrix;
            var lightDirectionTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(lightDirMatrix),directionalLight);
            gl.uniform3fv(lightColorHandle,  directionalLightColor);
            gl.uniform3fv(lightDirectionHandle,  lightDirectionTransformed);

            gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(normalMatrix));

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

    mouseSetup(canvas);
}

window.onload = init;

document.onkeypress = function (e) {

    switch (e.key) {
        case 'a': case 'A':
            cx -= 0.05;
            break;
        case 'd': case 'D':
            cx += 0.05;
            break;

        case 'e': case 'E':
            cy -= 0.05;
            break;
        case 'q': case 'Q':
            cy += 0.05;
            break;

        case 'w': case 'W':
            cz -= 0.05;
            break;
        case 's': case 'S':
            cz += 0.05;
            break;

        case 'r': case 'R':
            ang -= 1.5;
            break;
        case 't': case 'T':
            ang += 1.5;
            break;

        case 'z': case 'Z':
            elev -= 1.5;
            break;
        case 'x': case 'X':
            elev += 1.5;
            break;
    }

};
