#version 300 es
precision mediump float;
precision mediump int;

in vec3 vNormal;
in vec3 vPosition;
in vec4 vColor;
in vec3 vTankCamDir;
in vec3 vTankCamLoc;
in vec3 vLightPos;

uniform int isTank;

out vec4 fragmentColor;

void main() {
    // lighting variables
   vec3 normal = normalize(vNormal);
   vec3 lightCol = vec3(0.9);
   float ambLightInt = 0.3;
    
    // calculate lighting
    vec3 lightDir = normalize(vLightPos - vPosition);
    float diffLightInt = max(dot(normal, lightDir), 0.0);

    // check if it is in projection of camera
    float camProj = 0.0;
    if (isTank == 1) {
        vec3 camToFrag = vPosition - vTankCamLoc;
        vec3 camDir = vTankCamDir;
        float product = dot(normalize(camToFrag), camDir);
        if (product < 1.0 && product > 0.94) {
            camProj = (product - 0.94) / 0.09; // (1.0 - ((1.0 - product) / 0.01));
        }
    }

    vec3 lightInt = lightCol * (ambLightInt + diffLightInt + camProj);

    // set color
    // fragmentColor = vec4(camDir, 1.0);
    fragmentColor = vec4(lightInt * vColor.rgb, vColor.a);
}
