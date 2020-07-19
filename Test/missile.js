function changeCameraState(state) {
    setIsLookAtCamera(state);
    if (state) {
        $("#free-view-help").slideUp();
        setTimeout(function () {$("#look-at-help").slideDown();}, 500);
    } else {
        setTimeout(function () {$("#free-view-help").slideDown();}, 500);
        $("#look-at-help").slideUp();
    }
}

function changeLightColor() {
    setLightsColor($('#light-color').val())
}

function changeLightPositionPoint() {
    lightPositionX = $("#point-light-position-x").val();
    lightPositionY = $("#point-light-position-y").val();
    lightPositionZ = $("#point-light-position-z").val();
}

function changeLightPositionDirect() {
    lightDirPhi = $("#direct-light-position-phi").val();
    lightDirTheta = $("#direct-light-position-theta").val();
}

function changeToDirectLight() {
    $("#point-pane").slideUp();
    setTimeout(function () {$("#direct-pane").slideDown()}, 500);
    lightType = [1, 0, 0, 0];

}

function changeToPointLight() {
    $("#direct-pane").slideUp();
    setTimeout(function () {$("#point-pane").slideDown()}, 500);

    lightType = [0, 1, 0, 0];

}

function changeLightDecay() {
    lightDecay[0] = $("#point-pane").val();
}

function toggleAnimationState() {
    should_animate = !should_animate;
    if(should_animate) {
        playAnimationChange();
    } else {
        pauseAnimationChange();
    }
}

function resetAnimationState() {
    if(should_animate) {
        pauseAnimationChange();
    }
    should_animate = false;
    animationIndex = 0;
}

function playAnimationChange() {
    $("#action-btn").removeClass("btn-success");
    $("#action-btn").addClass("btn-danger");
    $("#action-btn").html("Pause");
}

function pauseAnimationChange() {
    $("#action-btn").removeClass("btn-danger");
    $("#action-btn").addClass("btn-success");
    $("#action-btn").html("Play");
}

function triggerKeyPress(keyVal) {
    $.event.trigger({ type : 'keypress', key: keyVal });
}

function lightChange() {
    let t = getLightType();
    console.log(t)
}

function getLightType() {
    return $("#light-selector").val();
}

function lightEnableChange() {
    console.log($("#enable-checkbox").prop("checked"))
}

function setLightEnableState(state) {
    $("#enable-checkbox").prop("checked", state)
}