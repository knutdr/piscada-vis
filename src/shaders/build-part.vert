#version 300 es
precision mediump float;
precision mediump int;

in vec3 position;
in vec3 normal;
in vec3 offset;

uniform mat4 projMat;
uniform mat4 viewMat;
uniform vec3 camRot;
uniform float particleScale;
uniform int activeFloor;
uniform int isolateFloor;
uniform vec4 hotspots[10];
uniform float maxDistance;
uniform int isolateHotspots;
uniform float hotspotThreshold;

out vec3 vPosition;
out vec3 vNormal;
out vec3 vColor;
out vec3 vLightPos;
flat out int render;

/**
 * finds the floor of the particle being rendered
 */
float getParticleFloor() {
    return floor((offset.y - 0.5 * 0.5 - 0.02) / 0.5);
}

/**
 * calculates the distance to the closest hotspot
 */
float closestDistance() {
    float closest = 1000.0;
    float particleFloor = getParticleFloor();
    for (int i = 0; i < 10; i++) {
        vec4 hotspot = hotspots[i];
        if (hotspot.w - 1.0 == particleFloor)
        {
            float distance = length(offset - hotspot.xyz);
            if (distance < closest) {
                closest = distance;
            }
        }
    }
    return closest;
}

/**
 * calculates color in the heatmap
 */
vec3 heatmapColor(float minVal, float maxVal, float val)
{
    float ratio = 2.0 * ((val - minVal) / (maxVal - minVal));
    float r = floor(max(0.0, 255.0 * (1.0 - ratio)));
    float b = floor(max(0.0, 255.0 * (ratio - 1.0)));
    float g = 255.0 - b - r;
    return vec3(r / 255.0, g / 255.0, b / 255.0);
}

/**
 * gets the camera transformation matrix
 * for lighting purposes
 */
mat4 getCameraTransform()
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
 * gets the model transform
 */
mat3 getTransform()
{
    return mat3(
        particleScale, 0.0, 0.0,
        0.0, particleScale, 0.0,
        0.0, 0.0, particleScale 
    );
}

/**
 * checks if the particle instance is over
 * the floor of the active story
 */
bool overFloor()
{
    return offset.y >= float(activeFloor) * 0.5 - 0.5 * 0.5 - 0.02;
}

/**
 * checks if the particle instance is under the ceiling of the
 * active story
 */
bool underCeiling()
{
    return offset.y < (float(activeFloor) - 1.0 ) * 0.5 - 0.5 * 0.5;
}

/**
 * decides color and whether or not to render
 */
void decideRendering()
{
    float closest = closestDistance();
    render = 1;
    vColor = vec3(0.4);

    if (closest < 1000.0)
    {
        vColor = heatmapColor(0.0, maxDistance, closest);
        if (isolateHotspots == 1 && closest >= hotspotThreshold) {
            render = 0;
        }
    }

    if (overFloor() || (isolateFloor == 1 && underCeiling()))
    {
        render = 0;
    }
}

void main()
{
    mat4 camTrans = getCameraTransform();
    mat3 transform = getTransform();

    gl_Position = projMat * viewMat * vec4(transform * (position + offset), 1.0);

    vPosition = vec3(camTrans * vec4(position, 1.0));
    vNormal = normalize(vec3(camTrans * vec4(normal, 1.0)));
    vLightPos = vec3(0.0, 5.0, 5.0);

    decideRendering();
}
