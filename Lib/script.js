var landscape = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
var missile = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);

var gl;


var lookRadius = 10.0;

async function main() {
    gl = new GL();
    gl.setProgram();
    // loading our model from privided asset
    var lanscapeModel = new Model(gl.baseDir + 'Models/Landscape/mount.obj', landscape);
    var missileModel = new Model(gl.baseDir + 'Models/Missile2/R73-Ready.obj', missile);
    await lanscapeModel.initModel();
    await missileModel.initModel();
    gl.loadModelInGl(lanscapeModel);
    gl.loadModelInGl(missile);
    gl.initTexture();

    gl.clear(viewport=true);
    gl.initLocation();





    gl.initMainMatrices();
    gl.initVertexArrayObject();





    draw();

    function draw() {
        gl.drawModels();
        window.requestAnimationFrame(draw);
    }

}
window.onload = main;
