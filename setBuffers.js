//**********************************************************************************//
//**********************************************************************************//
//                                                                                  //
//                              set buffers                                         //
//                                                                                  //
//**********************************************************************************//
//**********************************************************************************//

function createPositionBuffer(object,positionAttributeLocation) {
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.obj.getVertices()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
}

function createUvBuffer(object,uvAttributeLocation) {
    let uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.obj.getTextureCoord()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);
}

function createIndexBuffer(object) {
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.obj.getIndices()), gl.STATIC_DRAW);
}

function createNormalBuffer(object, norm) {
    let normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.obj.getVertexNormals()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(norm);
    gl.vertexAttribPointer(norm, 3, gl.FLOAT, false, 0, 0);
}

function setImage(object) {
    let image2 = new Image();
    image2.src = baseDir + object.texturePath;
    image2.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, textures[object.texture]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image2);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
}