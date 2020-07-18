function changeCameraState(state) {
    setIsLookAtCamera(state);
    if(state) {
        $("#help-info").slideUp();
    } else {
        $("#help-info").slideDown();
    }
}

function changeLightColor() {
    console.log($('#light-color').val());
}