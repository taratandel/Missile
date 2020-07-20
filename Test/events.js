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
    if (mouseState) {
        let dx = event.pageX - lastMouseX;
        let dy = lastMouseY - event.pageY;
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;

        if ((dx != 0) || (dy != 0)) {

            if (isLookAtCamera) {
                alpha = alpha + 0.5 * dx;
                beta = beta + 0.5 * dy;
            } else {
                ang = ang + 0.5 * dx;
                elev = elev + 0.5 * dy;
            }
        }
    }
}

function doMouseWheel(event) {
    var nLookRadius = lookRadius + event.wheelDelta / 1000.0;
    if ((nLookRadius > 2.0) && (nLookRadius < 20.0)) {
        lookRadius = nLookRadius;
    }
}

document.onkeypress = function (e) {

    // console.log(e.key);
    if (!isLookAtCamera) {
        let moveSpeed = 0.1;
        let radAng = utils.degToRad(ang);
        switch (e.key) {
            // camera move forward
            case 'w':
            case 'W':
                cz -= moveSpeed * Math.cos(radAng);
                cx += moveSpeed * Math.sin(radAng);
                break;

            // camera move backward
            case 's':
            case 'S':
                cz += moveSpeed * Math.cos(radAng);
                cx -= moveSpeed * Math.sin(radAng);
                break;

            // camera move left
            case 'a':
            case 'A':
                cz -= moveSpeed * Math.sin(radAng);
                cx -= moveSpeed * Math.cos(radAng);
                break;

            // camera move right
            case 'd':
            case 'D':
                cz += moveSpeed * Math.sin(radAng);
                cx += moveSpeed * Math.cos(radAng);
                break;

            // camera move up
            case 'e':
            case 'E':
                cy -= moveSpeed;
                // ay -= 0.01;
                break;

            // camera move down
            case 'q':
            case 'Q':
                cy += moveSpeed;
                // ay += 0.01;
                break;
        }
    } else {
        switch (e.key) {
            case '+':
                r -= 0.1;
                if (r < minR) {
                    r += 0.1
                }
                break;

            case '-':
                r += 0.1;
                break
        }
    }

};