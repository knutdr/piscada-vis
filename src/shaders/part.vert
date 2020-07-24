#version 300 es
precision highp float;
precision highp int;

in vec3 position;
in vec3 normal;
in vec3 offset;
in vec3 sonarColor;

uniform mat4 projMat;
uniform mat4 viewMat;
uniform vec3 camRot;
uniform float particleScale;
uniform vec3 hotspots[10];
uniform float hotspotThreshold;
uniform int isolate;
uniform int sonar;
uniform float layerDepth;

out vec3 vNormal;
out vec3 vPosition;
out vec3 vLightPos;
out vec3 vColor;

flat out int render;
flat out float distance;
flat out int isLayer;

/**
 * gets the closest heatspot distance
 */
float closestDistance() {
    float closest = length(offset - hotspots[0]);
    for (int i = 1; i < 10; i++) {
        float distance = length(offset - hotspots[i]);
        if (distance < closest) {
            closest = distance;
        }
    }
    return closest;
}

/**
 * calculates the color of a particle instance
 * based on a heatmap and distance from hotspot
 */
vec3 heatmapColor(float minVal, float maxVal, float val)
{
    float ratio = 2.0 * ((val - minVal) / (maxVal - minVal));
    float b = floor(max(150.0, 255.0 * (ratio - 1.0)));
    float g = floor(max(100.0, 255.0 * (1.0 - ratio)));
    float r = 255.0 - g - b;
    return vec3(r / 255.0, g / 255.0, b / 255.0);
}

/**
 * gets camera transformation matrix for lighting purposes
 */
mat4 getCameraTransformation()
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
    ) * mat4(
        1.0, 0.0, 0.0, offset.x,
        0.0, 1.0, 0.0, offset.y,
        0.0, 0.0, 1.0, offset.z,
        0.0, 0.0, 0.0, 1.0
    );
}

/**
 * gets model transformation
 */
mat3 getTransformation()
{
    return  mat3(
        particleScale, 0.0, 0.0,
        0.0, particleScale, 0.0,
        0.0, 0.0, particleScale 
    );
}

/**
 * decides color and whether or not to render
 */
void decideRendering()
{
    render = 1;
    if (sonar == 1) {
        vColor = sonarColor;
    } else {
        distance = closestDistance();
        vColor = heatmapColor(0.0, 0.95, distance);
        if (isolate == 1) {
            if (distance > hotspotThreshold) {
                render = 0;
            }
        }
    }
    isLayer = 0;
    if (offset.y >= layerDepth) {
        render = 0;
        isLayer = 1;
    }
}

void main() {
    mat4 camTrans = getCameraTransformation();
    mat3 transform = getTransformation();
    gl_Position = projMat * viewMat * vec4(transform * (position + offset), 1.0);

    vNormal = normalize(vec3(camTrans * vec4(normal, 1.0)));
    vPosition = vec3(camTrans * vec4(position, 1.0));
    vLightPos = vec3(0.0, 5.0, 5.0);

    decideRendering();
}
