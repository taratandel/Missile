var canvas;

var gl = null,
	program = null,
	mesh = null,
	skybox = null,
	imgtx = null,
	skyboxLattx = null,
	skyboxTbtx = null;
	
var projectionMatrix, 
	perspectiveMatrix,
	viewMatrix,
	worldMatrix,
	gLightDir,
	skyboxWM;
	
var ghostVisible = false;


//Parameters for Camera
var cx = 4.5;
var cy = 0.0;
var cz = 10.0;
var elevation = 0.01;
var angle = 0.01;
var roll = 0.01;

var lookRadius = 10.0;


var keys = [];
var vx = 0.0;
var vy = 0.0;
var vz = 0.0;
var rvx = 0.0;
var rvy = 0.0;
var rvz = 0.0;

var keyFunctionDown =function(e) {
  if(!keys[e.keyCode]) {
  	keys[e.keyCode] = true;
	switch(e.keyCode) {
	  case 37:
//console.log("KeyUp   - Dir LEFT");
		rvy = rvy + 1.0;
		break;
	  case 39:
//console.log("KeyUp   - Dir RIGHT");
		rvy = rvy - 1.0;
		break;
	  case 38:
//console.log("KeyUp   - Dir UP");
		rvx = rvx + 1.0;
		break;
	  case 40:
//console.log("KeyUp   - Dir DOWN");
		rvx = rvx - 1.0;
		break;
	  case 81:
//console.log("KeyUp   - Dir ROLL LEFT");
		rvz = rvz + 1.0;
		break;
	  case 69:
//console.log("KeyUp   - Dir ROLL RIGHT");
		rvz = rvz - 1.0;
		break;
	  case 65:
//console.log("KeyUp   - Pos LEFT");
		vx = vx - 1.0;
		break;
	  case 68:
//console.log("KeyUp   - Pos RIGHT");
		vx = vx + 1.0;
		break;
	  case 82:
//console.log("KeyUp   - Pos UP");
		vy = vy + 1.0;
		break;
	  case 70:
//console.log("KeyUp   - Pos DOWN");
		vy = vy - 1.0;
		break;
	  case 87:
//console.log("KeyUp   - Pos FORWARD");
		vz = vz - 1.0;
		break;
	  case 83:
//console.log("KeyUp   - Pos BACKWARD");
		vz = vz + 1.0;
		break;
	}
//	console.log(vx + " " + vy + " " + vz + " " + rvx + " " + rvy + " " + rvz);
  }
//	console.log(e.keyCode);
}

var keyFunctionUp =function(e) {
  if(keys[e.keyCode]) {
  	keys[e.keyCode] = false;
	switch(e.keyCode) {
	  case 37:
//console.log("KeyDown  - Dir LEFT");
		rvy = rvy - 1.0;
		break;
	  case 39:
//console.log("KeyDown - Dir RIGHT");
		rvy = rvy + 1.0;
		break;
	  case 38:
//console.log("KeyDown - Dir UP");
		rvx = rvx - 1.0;
		break;
	  case 40:
//console.log("KeyDown - Dir DOWN");
		rvx = rvx + 1.0;
		break;
	  case 81:
//console.log("KeyDown - Dir ROLL LEFT");
		rvz = rvz - 1.0;
		break;
	  case 69:
//console.log("KeyDown - Dir ROLL RIGHT");
		rvz = rvz + 1.0;
		break;
	  case 65:
//console.log("KeyDown - Pos LEFT");
		vx = vx + 1.0;
		break;
	  case 68:
//console.log("KeyDown - Pos RIGHT");
		vx = vx - 1.0;
		break;
	  case 82:
//console.log("KeyDown - Pos UP");
		vy = vy - 1.0;
		break;
	  case 70:
//console.log("KeyDown - Pos DOWN");
		vy = vy + 1.0;
		break;
	  case 87:
//console.log("KeyDown - Pos FORWARD");
		vz = vz + 1.0;
		break;
	  case 83:
//console.log("KeyDown - Pos BACKWARD");
		vz = vz - 1.0;
		break;
	  case 32:
//console.log("SPACE   - Ghost on/off");
//		ghostVisible = !ghostVisible;
		break;
	}
//	console.log(vx + " " + vy + " " + vz + " " + rvx + " " + rvy + " " + rvz);
  }
//	console.log(e.keyCode);
}
//'window' is a JavaScript object (if "canvas", it will not work)
window.addEventListener("keyup", keyFunctionUp, false);
window.addEventListener("keydown", keyFunctionDown, false);

		
// Vertex shader
var vs = `#version 300 es
#define POSITION_LOCATION 0
#define NORMAL_LOCATION 1
#define UV_LOCATION 2

layout(location = POSITION_LOCATION) in vec3 in_pos;
layout(location = NORMAL_LOCATION) in vec3 in_norm;
layout(location = UV_LOCATION) in vec2 in_uv;

uniform mat4 pMatrix;

out vec3 fs_pos;
out vec3 fs_norm;
out vec2 fs_uv;

void main() {
	fs_pos = in_pos;
	fs_norm = in_norm;
	fs_uv = vec2(in_uv.x, 1.0-in_uv.y);
	
	gl_Position = pMatrix * vec4(in_pos, 1);
}`;

// Fragment shader
var fs = `#version 300 es
precision highp float;

in vec3 fs_pos;
in vec3 fs_norm;
in vec2 fs_uv;

uniform sampler2D u_texture;
uniform vec4 lightDir;
//uniform float ambFact;

out vec4 color;

void main() {
	vec4 texcol = texture(u_texture, fs_uv);
	float ambFact = lightDir.w;
	float dimFact = (1.0-ambFact) * clamp(dot(normalize(fs_norm), lightDir.xyz),0.0,1.0) + ambFact;
	color = vec4(texcol.rgb * dimFact, texcol.a);
}`;

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
	if(mouseState) {
		var dx = event.pageX - lastMouseX;
		var dy = lastMouseY - event.pageY;
		lastMouseX = event.pageX;
		lastMouseY = event.pageY;
		
		if((dx != 0) || (dy != 0)) {
			angle = angle + 0.5 * dx;
			elevation = elevation + 0.5 * dy;
		}
	}
}
function doMouseWheel(event) {
	var nLookRadius = lookRadius + event.wheelDelta/1000.0;
	if((nLookRadius > 2.0) && (nLookRadius < 20.0)) {
		lookRadius = nLookRadius;
	}
}

// texture loader callback
var textureLoaderCallback = function() {
	var textureId = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + this.txNum);
	gl.bindTexture(gl.TEXTURE_2D, textureId);		
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);		
// set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

// The real app starts here
function main(){
//	var qa1 = Quaternion.fromAxisAngle([1,0,0],utils.degToRad(0));
//	var qa2 = Quaternion.fromAxisAngle([1,0,0],utils.degToRad(30));
//	console.log(qa1.slerp(qa2)(0));
//	console.log(qa1.slerp(qa2)(0.5));
//	console.log(qa1.slerp(qa2)(1));
//	console.log(qa1.slerp(qa2)(-0.5));
//	console.log(qa1.slerp(qa2)(-1));
	
	
	// setup everything else
	var canvas = document.getElementById("my-canvas");
	canvas.addEventListener("mousedown", doMouseDown, false);
	canvas.addEventListener("mouseup", doMouseUp, false);
	canvas.addEventListener("mousemove", doMouseMove, false);
	canvas.addEventListener("mousewheel", doMouseWheel, false);
	
	try{
		gl= canvas.getContext("webgl2");
	} catch(e){
		console.log(e);
	}
	
	if(gl){
		// Compile and link shaders
		program = gl.createProgram();
		var v1 = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(v1, vs);
		gl.compileShader(v1);
		if (!gl.getShaderParameter(v1, gl.COMPILE_STATUS)) {
			alert("ERROR IN VS SHADER : " + gl.getShaderInfoLog(v1));
		}
		var v2 = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(v2, fs)
		gl.compileShader(v2);		
		if (!gl.getShaderParameter(v2, gl.COMPILE_STATUS)) {
			alert("ERROR IN FS SHADER : " + gl.getShaderInfoLog(v2));
		}			
		gl.attachShader(program, v1);
		gl.attachShader(program, v2);
		gl.linkProgram(program);				
		
		gl.useProgram(program);

		// Load mesh using the webgl-obj-loader library
		mesh = await utils.get_objstr(gl.baseDir + 'Models/Missile2/R73-Ready.obj')
		skybox = new OBJ.Mesh(mesh);
		
		// Create the textures
		imgtx = new Image();
		imgtx.txNum = 0;
		imgtx.onload = textureLoaderCallback;
		imgtx.src = TextureData;

		skyboxLattx = new Image();
		skyboxLattx.txNum = 1;
		skyboxLattx.onload = textureLoaderCallback;
		skyboxLattx.src = SkyboxLatData;

		skyboxTbtx = new Image();
		skyboxTbtx.txNum = 2;
		skyboxTbtx.onload = textureLoaderCallback;
		skyboxTbtx.src = SkyboxTbData;
		
		// links mesh attributes to shader attributes
		program.vertexPositionAttribute = gl.getAttribLocation(program, "in_pos");
		gl.enableVertexAttribArray(program.vertexPositionAttribute);
		 
		program.vertexNormalAttribute = gl.getAttribLocation(program, "in_norm");
		gl.enableVertexAttribArray(program.vertexNormalAttribute);
		 
		program.textureCoordAttribute = gl.getAttribLocation(program, "in_uv");
		gl.enableVertexAttribArray(program.textureCoordAttribute);

		program.WVPmatrixUniform = gl.getUniformLocation(program, "pMatrix");
		program.textureUniform = gl.getUniformLocation(program, "u_texture");
		program.lightDir = gl.getUniformLocation(program, "lightDir");
//		program.ambFact = gl.getUniformLocation(program, "ambFact");
		
		OBJ.initMeshBuffers(gl, mesh);
		OBJ.initMeshBuffers(gl, skybox);
		
		// prepares the world, view and projection matrices.
		var w=canvas.clientWidth;
		var h=canvas.clientHeight;
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.viewport(0.0, 0.0, w, h);
		
		perspectiveMatrix = utils.MakePerspective(60, w/h, 0.1, 1000.0);
		
	 // turn on depth testing
	    gl.enable(gl.DEPTH_TEST);
	
	
		// algin the skybox with the light
		gLightDir = [-1.0, 0.0, 0.0, 0.0];
		skyboxWM = utils.multiplyMatrices(utils.MakeRotateZMatrix(30), utils.MakeRotateYMatrix(135));
		gLightDir = utils.multiplyMatrixVector(skyboxWM, gLightDir);

		animFramesS = anim();
	
		drawScene();
	}else{
		alert("Error: WebGL not supported by your browser!");
	}
}

var animFramesS;

var animFramesG =
[
 [2, [0,0,0],   Quaternion.fromAxisAngle([1,0,0],utils.degToRad(0)),
 	   [0,0.5,0], Quaternion.fromAxisAngle([1,0,0],utils.degToRad(30))],
 [2, [1,2,1],   Quaternion.fromAxisAngle([1,0,0],utils.degToRad(90)),
 	   [1,2,0.5], Quaternion.fromAxisAngle([1,0,0],utils.degToRad(60))],
 [2, [6,1,0],   Quaternion.fromAxisAngle([0,1,0],utils.degToRad(90)),
 	   [6,1,0.5], Quaternion.fromAxisAngle([0,1,0],utils.degToRad(60))],
 [2, [0,1,0],   Quaternion.fromAxisAngle([0,0,1],utils.degToRad(90)),
 	   [0,1,0.5], Quaternion.fromAxisAngle([0,0,1],utils.degToRad(45))]
];


var timeArrayElA = [0,0];
var arrayElIdA = [0,0];

function animCall(t, mode) {
	var animFrames = mode ? animFramesS : animFramesG;
	var arrayElId = arrayElIdA[mode ? 0 : 1];
	var timeArrayEl = timeArrayElA[mode ? 0 : 1];
	
	if(timeArrayEl) {
		if(t - timeArrayEl > animFrames[arrayElId][0]) {
			timeArrayEl += animFrames[arrayElId][0];
			arrayElId = (arrayElId + 1) % animFrames.length;
		}
	} else {
		timeArrayEl = t
		arrayElId = 0;
	}
	
	var deltaT = t - timeArrayEl;
	var alpha = deltaT / animFrames[arrayElId][0];
	var nextElId = (arrayElId + 1) % animFrames.length;

	var cx, cy, cz, qa0, qa1, qa2, qa3;
	if(mode) {
		cx = [animFrames[arrayElId][1][0], animFrames[arrayElId][3][0],
			  animFrames[arrayElId][5][0], animFrames[arrayElId][7][0]];
		cy = [animFrames[arrayElId][1][1], animFrames[arrayElId][3][1],
			  animFrames[arrayElId][5][1], animFrames[arrayElId][7][1]];
		cz = [animFrames[arrayElId][1][2], animFrames[arrayElId][3][2],
			  animFrames[arrayElId][5][2], animFrames[arrayElId][5][2]];
	
		qa0 = animFrames[arrayElId][2];
		qa1 = animFrames[arrayElId][4];
		qa3 = animFrames[arrayElId][6];
		qa2 = animFrames[arrayElId][8];
	} else {	
		cx = [animFrames[arrayElId][1][0], animFrames[arrayElId][3][0],
			  2*animFrames[nextElId][3][0] - animFrames[nextElId][1][0], animFrames[nextElId][1][0]];
		cy = [animFrames[arrayElId][1][1], animFrames[arrayElId][3][1],
			  2*animFrames[nextElId][3][1] - animFrames[nextElId][1][1], animFrames[nextElId][1][1]];
		cz = [animFrames[arrayElId][1][2], animFrames[arrayElId][3][2],
			  2*animFrames[nextElId][3][2] - animFrames[nextElId][1][2], animFrames[nextElId][1][2]];
	
		qa0 = animFrames[arrayElId][2];
		qa1 = animFrames[arrayElId][4];
		qa3 = animFrames[nextElId][2];
		qa2 = qa3.slerp(animFrames[nextElId][4])(-1);
	}
		
	var qx = [qa0.x, qa1.x, qa2.x, qa3.x];
	var qy = [qa0.y, qa1.y, qa2.y, qa3.y];
	var qz = [qa0.z, qa1.z, qa2.z, qa3.z];
	var qw = [qa0.w, qa1.w, qa2.w, qa3.w];

	var q01 = qa0.slerp(qa1)(alpha);
	var q12 = qa1.slerp(qa2)(alpha);
	var q23 = qa2.slerp(qa3)(alpha);
	var q012 = q01.slerp(q12)(alpha);
	var q123 = q12.slerp(q23)(alpha);
	var qalpha = q012.slerp(q123)(alpha);
	var MR = qalpha.toMatrix4();
	
	var uma = 1-alpha;
	var c0 = uma*uma*uma;
	var c1 = 3*uma*uma*alpha;
	var c2 = 3*uma*alpha*alpha;
	var c3 = alpha*alpha*alpha;
	
	var MT =  utils.MakeTranslateMatrix(cx[0]*c0 + cx[1]*c1 + cx[2]*c2 + cx[3]*c3, 
										cy[0]*c0 + cy[1]*c1 + cy[2]*c2 + cy[3]*c3,
										cz[0]*c0 + cz[1]*c1 + cz[2]*c2 + cz[3]*c3);

	arrayElIdA[mode ? 0 : 1] = arrayElId;
	timeArrayElA[mode ? 0 : 1] = timeArrayEl;
	
	return utils.multiplyMatrices(MT, MR);
}

var lastUpdateTime;
var g_time = 0;

function drawScene() {
		// compute time interval
		var currentTime = (new Date).getTime();
		var deltaT;
		if(lastUpdateTime){
			deltaT = (currentTime - lastUpdateTime) / 1000.0;
		} else {
			deltaT = 1/50;
		}
		lastUpdateTime = currentTime;
		g_time += deltaT;

		viewMatrix = utils.multiplyMatrices(
						utils.MakeRotateZMatrix(-roll),utils.MakeView(cx, cy, cz, elevation, angle));
		viewMatrixR = viewMatrix;


		// Magic for moving the ship
		dvecmat = utils.transposeMatrix(viewMatrix); dvecmat[12] = dvecmat[13] = dvecmat[14] = 0.0;
		xaxis = [dvecmat[0],dvecmat[4],dvecmat[8]];
		yaxis = [dvecmat[1],dvecmat[5],dvecmat[9]];
		zaxis = [dvecmat[2],dvecmat[6],dvecmat[10]];
		
		if((rvx != 0) || (rvy != 0) || (rvz != 0)) {
			qx = Quaternion.fromAxisAngle(xaxis, utils.degToRad(rvx * 1));
			qy = Quaternion.fromAxisAngle(yaxis, utils.degToRad(rvy * 1));
			qz = Quaternion.fromAxisAngle(zaxis, utils.degToRad(rvz * 1));
			newDvecmat = utils.multiplyMatrices(utils.multiplyMatrices(utils.multiplyMatrices(
				qy.toMatrix4(), qx.toMatrix4()), qz.toMatrix4()), dvecmat);
			R11=newDvecmat[10];R12=newDvecmat[8];R13=newDvecmat[9];
			R21=newDvecmat[2]; R22=newDvecmat[0];R23=newDvecmat[1];
			R31=newDvecmat[6]; R32=newDvecmat[4];R33=newDvecmat[5];
			
			if((R31<1)&&(R31>-1)) {
				theta = -Math.asin(R31);
				phi = Math.atan2(R32/Math.cos(theta), R33/Math.cos(theta));
				psi = Math.atan2(R21/Math.cos(theta), R11/Math.cos(theta));
				
			} else {
				phi = 0;
				if(R31<=-1) {
					theta = Math.PI / 2;
					psi = phi + Math.atan2(R12, R13);
				} else {
					theta = -Math.PI / 2;
					psi = Math.atan2(-R12, -R13) - phi;
				}
			}
			elevation = theta/Math.PI*180;
			roll      = phi/Math.PI*180;
			angle     = psi/Math.PI*180;
		}

		delta = utils.multiplyMatrixVector(dvecmat, [vx, vy, vz, 0.0]);
		cx += delta[0] / 10;
		cy += delta[1] / 10;
		cz += delta[2] / 10;

		projectionMatrix  = utils.multiplyMatrices(perspectiveMatrix, viewMatrixR);		
		projectionMatrixS = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);		

		// draws the skybox
		gl.bindBuffer(gl.ARRAY_BUFFER, skybox.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, skybox.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	    gl.bindBuffer(gl.ARRAY_BUFFER, skybox.textureBuffer);
	    gl.vertexAttribPointer(program.textureCoordAttribute, skybox.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, skybox.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, skybox.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 1.0);
		 
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skybox.indexBuffer);		
		WVPmatrix = utils.multiplyMatrices(projectionMatrix, utils.multiplyMatrices(utils.MakeTranslateMatrix(cx,cy,cz),utils.multiplyMatrices(skyboxWM,utils.MakeScaleMatrix(500.0))));
		gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));						gl.uniform1i(program.textureUniform, 1);
		gl.drawElements(gl.TRIANGLES, 24, gl.UNSIGNED_SHORT, 24);
		gl.uniform1i(program.textureUniform, 2);
		gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
		

		// draws the request
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
	    gl.vertexAttribPointer(program.textureCoordAttribute, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		 
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);		


		gl.uniform1i(program.textureUniform, 0);
		gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 0.2);
		WVPmatrix = utils.multiplyMatrices(projectionMatrix, animCall(g_time, true));
		gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));		
		if(!ghostVisible)
			gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);


		if(ghostVisible) {
			WVPmatrix = utils.multiplyMatrices(projectionMatrix, animCall(g_time, false));
			gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));		
			gl.drawElements(gl.LINE_STRIP, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
		
		window.requestAnimationFrame(drawScene);		
}