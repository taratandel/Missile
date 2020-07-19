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
    setLightsColor($('#light-color').val(), )
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
let lightsType = [1,0,0,0];
function changeToDirectLight() {
    $("#point-pane").slideUp();
    setTimeout(function () {$("#direct-pane").slideDown()}, 500);

    lightsType = [1, 0, 0, 0];
    getLightsArray();

}

function changeToPointLight() {
    $("#direct-pane").slideUp();
    setTimeout(function () {$("#point-pane").slideDown()}, 500);

    lightsType = [1, 0, 0, 0];
    getLightsArray();

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
    getLightsArray()

}

function getLightType() {
    return $("#light-selector").val();
}

function lightEnableChange() {
    getLightsArray()
}

function getlightEnableStatus() {
    return  $("#enable-checkbox").prop("checked")
}


function setLightEnableState(state) {
    $("#enable-checkbox").prop("checked", state)
}

function getLightsArray() {

    if (getLightType() == 0 && !getlightEnableStatus()) {
        lightType[0] = [0, 0, 0, 0];
    }
    else if (getLightType() == 0 && getlightEnableStatus() ) {
        lightType[0] = lightsType;
    }
    if (getLightType() == 1 && getlightEnableStatus()) {
        lightType[1] = lightsType;
    }
    else if (getLightType() == 1 && !getlightEnableStatus()) {
        lightType[1] = [0,0,0,0]
    }
}