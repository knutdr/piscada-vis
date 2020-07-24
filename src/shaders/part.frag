#version 300 es
precision mediump float;
precision mediump int;

in vec3 vNormal;
in vec3 vPosition;
in vec3 vLightPos;
in vec3 vColor;

flat in int render;
flat in float distance;
flat in int isLayer;

out vec4 fragmentColor;

void main() {
    if (render == 1) {
        // lighting variables
        vec3 normal = normalize(vNormal);
        vec3 lightCol = vec3(0.8);
        float ambLightInt = 0.5;
    
        // calculate lighting
        vec3 lightDir = normalize(vLightPos - vPosition);
        float diffLightInt = max(dot(normal, lightDir), 0.0);
        vec3 lightInt = lightCol * (ambLightInt + diffLightInt);

        // set color
        fragmentColor = vec4(lightInt * vColor, 1.0);
    } else {
        if (isLayer == 1) {
            discard;
        } else if (fract(distance / 0.02) >= 0.0) {
            discard;
        }
    }
}