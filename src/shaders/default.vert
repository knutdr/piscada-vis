#version 300 es
precision mediump float;

in vec3 position;
in vec3 normal;
in vec4 vertexColor;

uniform mat4 modMat;
uniform mat4 projMat;
uniform mat4 viewMat;
uniform vec3 camRot;

uniform vec3 tankCamDir;
uniform vec3 tankCamLoc;
uniform int isCamera;

out vec3 vNormal;
out vec3 vPosition;
out vec4 vColor;
out vec3 vTankCamDir;
out vec3 vTankCamLoc;
out vec3 vLightPos;

/**
 * gets the transformation of the camera for lighting
 * purposes
 */
mat4 getCameraTrans()
{
    return mat4(
         1.0, 0.0, 0.0, 0.0,
         0.0, cos(camRot.x), sin(camRot.x), 0.0,
         0.0, -sin(camRot.x), cos(camRot.x), 0.0,
         0.0, 0.0, 0.0, 1.0
     ) * mat4(
         cos(camRot.z), sin(camRot.z), 0.0, 0.0,
         -sin(camRot.z), cos(camRot.z), 0.0, 0.0,
         0.0, 0.0, 1.0, 0.0,
         0.0, 0.0, 0.0, 1.0
     ) * mat4(
         cos(camRot.y), 0.0, -sin(camRot.y), 0.0,
         0.0, 1.0, 0.0, 0.0,
         sin(camRot.y), 0.0, cos(camRot.y), 0.0,
         0.0, 0.0, 0.0, 1.0
     );
}

/**
 * gets the rotation transformation of the tank camera
 * for lighting purposes
 */
mat4 getTankCameraRotation()
{
    return mat4(
         cos(tankCamDir.y), 0.0, -sin(tankCamDir.y), 0.0,
         0.0, 1.0, 0.0, 0.0,
         sin(tankCamDir.y), 0.0, cos(tankCamDir.y), 0.0,
         0.0, 0.0, 0.0, 1.0
     ) * mat4(
         cos(tankCamDir.z), sin(tankCamDir.z), 0.0, 0.0,
         -sin(tankCamDir.z), cos(tankCamDir.z), 0.0, 0.0,
         0.0, 0.0, 1.0, 0.0,
         0.0, 0.0, 0.0, 1.0
     ) * mat4(
         1.0, 0.0, 0.0, 0.0,
         0.0, cos(tankCamDir.x), sin(tankCamDir.x), 0.0,
         0.0, -sin(tankCamDir.x), cos(tankCamDir.x), 0.0,
         0.0, 0.0, 0.0, 1.0
     );
}

void main() {
    mat4 camTrans = getCameraTrans();
    mat4 tankCamRot = getTankCameraRotation();

    gl_Position = projMat * viewMat * modMat * vec4(position, 1.0);

    if (isCamera == 1) {
        vNormal = normalize(vec3(camTrans * tankCamRot * vec4(normal, 1.0)));
        vPosition = vec3(camTrans * tankCamRot * vec4(position, 1.0));
    } else {
        vNormal = normalize(vec3(camTrans * vec4(normal, 1.0)));
        vPosition = vec3(camTrans * vec4(position, 1.0));
    }

    vTankCamDir = vec3(camTrans * tankCamRot * vec4(1.0, 0.0, 0.0, 1.0));
    vTankCamLoc = vec3(camTrans * vec4(tankCamLoc, 1.0));

    vColor = vertexColor;
    vLightPos = vec3(0.0, 5.0, 10.0);
}
