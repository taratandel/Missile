function changeCameraState(state) {
    setIsLookAtCamera(state);
    if(state) {
        $("#free-view-help").hide();
        $("#look-at-help").slideDown();
    } else {
        $("#free-view-help").slideDown();
        $("#look-at-help").hide();
    }
}

function changeLightColor() {
    setLightsColor($('#light-color').val())
}