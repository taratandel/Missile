function changeCameraState(state) {
    setIsLookAtCamera(state);
    if (state) {
        $("#free-view-help").slideUp();
        setTimeout(function () {
            $("#look-at-help").slideDown();
        }, 500);
    } else {
        setTimeout(function () {
            $("#free-view-help").slideDown();
        }, 500);
        $("#look-at-help").slideUp();
    }
}

function changeLightColor() {
    lightsColor[getLightType()] = getColorNumber($('#light-color').val())
}

function setAmbientLightColor() {
    ambientLightColor = getColorNumber($('#ambient-color').val())
}

function setDiffuseColor() {
    diffuseColor = getColorNumber($('#diffuse-color').val())
}

function setSpecularColor() {
    specularColor = getColorNumber($('#specular-color').val())
}

function setAmbientMatColor() {
    ambientMatColor = getColorNumber($('#ambient-mat-color').val())
}

function setSpecShine() {
    SpecShine = $('#specular-shiny').val()
}

function changeLightPositionPoint() {
    lightPositionX[getLightType()] = $("#point-light-position-x").val();
    lightPositionY[getLightType()] = $("#point-light-position-y").val();
    lightPositionZ[getLightType()] = $("#point-light-position-z").val();
}

function changeLightPositionDirect() {

    lightDirPhi[getLightType()] = $("#direct-light-position-phi").val();
    lightDirTheta[getLightType()] = $("#direct-light-position-theta").val();
}

let lastLightTypeSelected = 0;

function changeToDirectLight() {
    $("#point-pane").slideUp();
    setTimeout(function () {
        $("#direct-pane").slideDown()
    }, 500);

    lastLightTypeSelected = 0;
    if(getLightEnableStatus()) {
        lightType[getLightType()] = [1, 0 , 0, 0];
    } else {
        lightType[getLightType()] = [0, 0 , 0, 0];
    }
    // lastLightType = [1, 0, 0, 0];
    // getLightsArray();

}

function changeToPointLight() {
    $("#direct-pane").slideUp();
    setTimeout(function () {
        $("#point-pane").slideDown()
    }, 500);

    lastLightTypeSelected = 1;
    if(getLightEnableStatus()) {
        lightType[getLightType()] = [0, 1 , 0, 0];
    } else {
        lightType[getLightType()] = [0, 0 , 0, 0];
    }
    // lastLightType = [0, 1, 0, 0];
    // getLightsArray();

}

function changeLightDecay() {
    lightDecay[getLightType()] = $("#light-decay").val();
}

function toggleAnimationState() {
    should_animate = !should_animate;
    if (should_animate) {
        playAnimationChange();
    } else {
        pauseAnimationChange();
    }
}

function resetAnimationState() {
    if (should_animate) {
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
    $.event.trigger({type: 'keypress', key: keyVal});
}

function lightChange() {
    // getLightsArray();
    restoreLightParameters(getLightType())

}

function getLightType() {
    return $("#light-selector").val();
}

function lightEnableChange() {
    getLightsArray();
}

function getLightEnableStatus() {
    return $("#enable-checkbox").prop("checked")
}


function setLightEnableState(state) {
    $("#enable-checkbox").prop("checked", state)
}

function getLightsArray() {
    if (getLightEnableStatus()) {
        switch (lastLightTypeSelected) {
            case 0:
                lightType[getLightType()] = [1, 0, 0, 0];
                break;
            case 1:
                lightType[getLightType()] = [0, 1, 0, 0];
                break;
        }

    } else {
        lightType[getLightType()] = [0, 0, 0, 0];
    }
}

function getColorNumber(color) {
    return color.substr(1);
}

function restoreLightParameters(lightNo) {
    // restore the light color
    $('#light-color').val(`#${lightsColor[lightNo]}`);

    // direction of the point light
    $("#point-light-position-x").val(lightPositionX[lightNo]);
    $("#point-light-position-y").val(lightPositionY[lightNo]);
    $("#point-light-position-z").val(lightPositionZ[lightNo]);

    // fdecay of point light
    $("#light-decay").val(lightDecay[lightNo]);

    // direction of the direct light
    $("#direct-light-position-phi").val(lightDirPhi[lightNo]);
    $("#direct-light-position-theta").val(lightDirTheta[lightNo]);

    // restore the enable checkbox and light type
    console.log(lightNo, lightType[lightNo]);
    if ((lightType[lightNo][0] + lightType[lightNo][1]) === 0) {
        setLightEnableState(false);

    } else if (lightType[lightNo][0] === 1) {
        setLightEnableState(true);

        $("#direct-light").prop("checked", true);
        $("#point-light").prop("checked", false);

        if(lastLightTypeSelected === 1) {
            changeToDirectLight();
        }

    } else if (lightType[lightNo][1] === 1) {
        setLightEnableState(true);

        $("#direct-light").prop("checked", false);
        $("#point-light").prop("checked", true);

        if(lastLightTypeSelected === 0) {
            changeToPointLight();
        }
    }
}