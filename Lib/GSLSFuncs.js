class GL {
    constructor() {
        // Folders utils
        var path = window.location.pathname;
        var page = path.split("/").pop();
        this.baseDir = window.location.href.replace(page, '');
        this.shaderDir = this.baseDir + 'lib/shaders/';


        // WebGL variables
        this.canvas = document.getElementById("my-canvas");
        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl) {
            document.write("GL context not opened");
        }

        // Other variables
        this.positionAttributeLocation = null;
        this.uvAttributeLocation = null;
        this.matrixLocation = null;
        this.textLocation = null;
        this.norm = null;

        this.texture = null;

        // Main matrices
        this.perspectiveMatrix = null;
        this.viewMatrix = null;
        this.projectionMatrix = null;
        this.worldMatrix = null;
        this.gLightDir = null;
        this.lightDir = null
        this.skyboxWM= null;
        //Parameters for Camera
        this.cx = 0.0;
        this.cy = 2.0;
        this.cz = 7.0;
        this.elevation = 0.01;
        this.angle = 0.04;
        this.roll = -0.04;
        // Models container
        this.models = [];

        this.currentTime = (new Date).getTime();
        this.lastUpdateTime = null;
    }

    setProgram() {
        let vs = `#version 300 es
        #define POSITION_LOCATION 0
        #define NORMAL_LOCATION 1
        #define UV_LOCATION 2
        
        layout(location = POSITION_LOCATION) in vec3 a_position;
        layout(location = NORMAL_LOCATION) in vec3 in_norm;
        layout(location = UV_LOCATION) in vec2 a_uv;
        
        out vec3 fs_pos;
        out vec3 fs_norm;
        out vec2 fs_uv;
        
        uniform mat4 matrix; 
        void main() {
            fs_pos = a_position;
	        fs_norm = in_norm;
	        fs_uv = vec2(a_uv.x, 1.0-a_uv.y);
            gl_Position = matrix * vec4(a_position, 1.0);
        }
        `

        let fs = `#version 300 es
        
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
        `
//creates the shaders using utils
        var vertexShader = utils.createShader(this.gl, this.gl.VERTEX_SHADER, vs);
        var fragmentShader = utils.createShader(this.gl, this.gl.FRAGMENT_SHADER, fs);
        // link them to the program
        this.program = utils.createProgram(this.gl, vertexShader, fragmentShader);
        this.gl.useProgram(this.program);
    }

    clear(setViewPort = false) {
        utils.resizeCanvasToDisplaySize(this.gl.canvas);
        if (setViewPort) {
            // normalized coordinates to screen coordinates how to do that is specified here
            // Tell WebGL how to convert from clip space to pixels
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        }
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        // depth test it will draw everythin but just show the things that are closer to the camera
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        if (setViewPort) {
            this.gl.enable(this.gl.DEPTH_TEST);
        }
    }

    clearOptimized() {
        utils.resizeCanvasToDisplaySize(this.gl.canvas);
        this.gl.clearColor(1.0, 1.0, 1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    initLocation() {
        // look up where the vertex data needs to go.
        // need to tell the input where we have the buffer of the positio
        // wee need to creat a bridge
        // where we take the input from
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.uvAttributeLocation = this.gl.getAttribLocation(this.program, "a_uv");
        this.matrixLocation = this.gl.getUniformLocation(this.program, "matrix");
        this.textLocation = this.gl.getUniformLocation(this.program, "u_texture");
        this.lightDir = this.gl.getUniformLocation(this.program, "lightDir");
        this.norm = this.gl.getAttribLocation(this.program, "in_norm");

    }

    initVertexArrayObject() {
        //A WebGLVertexArrayObject representing a vertex array object (VAO) which points to vertex array data.
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);
    }

    initMainMatrices() {
        // we should make our perspective matrix
        //the z coordinates are indeed negative.
        // n  the distance from origin of the near plane corresponds to the distance of the projection plane d.
        // f distance from origin to the far plane
        // fovy tells us how wide can see our camera
        this.perspectiveMatrix = utils.MakePerspective(70, this.gl.canvas.width / this.gl.canvas.height, 0.01, 100.0);
        // algin the skybox with the light
        this.gLightDir = [-1.0, 1.0, 1.0, 1.0];
        // this.skyboxWM = utils.multiplyMatrices(utils.MakeRotateZMatrix(30), utils.MakeRotateYMatrix(135));
        // this.gLightDir = utils.multiplyMatrixVector(this.skyboxWM, this.gLightDir);
    // we should use look-at direction since we are following the missile and it's like 3rd person
    //    In the look-at model, the center of the camera is positioned at c=(cx, cy, cz), and the target is a point of coordinates a=(ax, ay, az).
        // The technique also requires the up vector: the direction u=(ux, uy, uz) to which the vertical side of the screen is aligned.
        // the position of the camera must be related to the position of the object

        this.viewMatrix = utils.multiplyMatrices(
            utils.MakeRotateZMatrix(-this.roll),utils.MakeView(this.cx, this.cy, this.cz, this.elevation, this.angle));
    }

    createPositionBuffer(modelVertices) {
        // Create buffer
        var positionBuffer = this.gl.createBuffer();
        // Bind to buffer so that every other function call refers to that buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        // Pass data to buffer (on GPU)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(modelVertices), this.gl.STATIC_DRAW);


        // First off we need to turn the attribute on.
        // This tells WebGL we want to get data out of a buffer.
        // If we don't turn on the attribute then the attribute will have a constant value.
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);

        // How to pull the data out of the buffer
        // gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
    }

    createUvBuffer(modelTextCoords) {
        var uvBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, uvBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(modelTextCoords), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.uvAttributeLocation);
        this.gl.vertexAttribPointer(this.uvAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        // this.gl.enableVertexAttribArray(this.norm)
    }

    createIndexBuffer(modelIndices) {
        var indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelIndices), this.gl.STATIC_DRAW);
    }

    // I had to pass gl like this because this.gl gave some problems at runtime
    createTexture(url, gl = this.gl) {
        // Create a texture.

        var texture = gl.createTexture();
        // bind to the TEXTURE_2D bind point of texture unit 0

        gl.bindTexture(gl.TEXTURE_2D, texture);

        var image = new Image();
        image.src = this.baseDir + url;
        // Asynchronously load an image

        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
        };

        this.texture = texture;
    }

    drawScene(model) {
        var viewWorldMatrix = utils.multiplyMatrices(this.viewMatrix, model.localMatrix);
        var projectionMatrix = utils.multiplyMatrices(this.perspectiveMatrix, viewWorldMatrix);
        // here when we are creating the matrix location we should consider animation
        this.gl.uniformMatrix4fv(this.matrixLocation, this.gl.FALSE, utils.transposeMatrix(projectionMatrix));
        this.gl.uniform4f(this.program.lightDir, this.gLightDir[0], this.gLightDir[1], this.gLightDir[2], 1.0);
        this.gl.uniform1i(this.textLocation, this.texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, model.getIndices().length, this.gl.UNSIGNED_SHORT, 0);

    }

    updateModelData(model) {
        this.createPositionBuffer(model.getVertices());
        this.createUvBuffer(model.getTextureCoord());
        this.createIndexBuffer(model.getIndices());
    }

    loadModelInGl(model) {
        // combine the arrays of models
        this.models.push(model);
    }

    initTexture() {
        this.createTexture('Models/Landscape/ground_grass_3264_4062_Small.jpg');
        // this.createTexture('Models/Missile2/R73_Texture.png');
    }

    drawModels() {
        this.clearOptimized();
        this.models.forEach(model => {
            this.updateModelData(model);
            this.drawScene(model);
        });
    }
}