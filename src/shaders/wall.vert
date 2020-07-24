#version 300 es
precision mediump float;
precision mediump int;

in vec3 position;
in vec3 normal;
// instance
in vec3 offset;
in vec3 rotation;
in vec3 scale;
in vec2 uvs;

uniform mat4 projMat;
uniform mat4 viewMat;

uniform vec3 camRot;
uniform int floorLevel;
uniform int isolateFloor;
uniform int wallTransparency;

out vec3 vPosition;
out vec3 vNormal;
out vec3 vLightPos;

out vec2 vUvs;
flat out int vTexture;

flat out float alpha;
flat out int render;

/**
 * checks if the vertex is part of the ceiling
 */
bool isCeiling()
{
    if (rotation.z != 0.0)
    {
        if (fract((offset.y + 0.25 + 0.02) / 0.5) == 0.0) {
            return true;
        }
    }
    return false;
}

/**
 * checks if the vertex is over the floor level
 */
bool overFloor()
{
    return offset.y >= float(floorLevel) * 0.5 - 0.5 * 0.5 - 0.02;
}

/**
 * checks if the vertex is under the ceiling level
 */
bool underCeiling()
{
   return offset.y < (float(floorLevel) - 1.0) * 0.5 - 0.5 * 0.5;
}

/**
 * checks if the vertex is under the floor level
 */
bool underFloor()
{
    return offset.y < float(floorLevel) * 0.5 - 0.5 * 0.5 - 0.02;
}

/**
 * checks if the vertex is over the ceiling level
 */
bool overCeiling()
{
   return offset.y >= (float(floorLevel) - 1.0) * 0.5 - 0.5 * 0.5;
}

/**
 * gets the transform matrix of the instance
 */
mat4 getTransform()
{
    return mat4(
        scale.x, 0.0, 0.0, 0.0,
        0.0, scale.y, 0.0, 0.0,
        0.0, 0.0, scale.z, 0.0,
        0.0, 0.0, 0.0, 1.0
    ) * mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, cos(rotation.x), sin(rotation.x), 0.0,
        0.0, -sin(rotation.x), cos(rotation.x), 0.0,
        0.0, 0.0, 0.0, 1.0
    ) * mat4(
        cos(rotation.z), sin(rotation.z), 0.0, 0.0,
        -sin(rotation.z), cos(rotation.z), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ) * mat4(
        cos(rotation.y), 0.0, -sin(rotation.y), 0.0,
        0.0, 1.0, 0.0, 0.0,
        sin(rotation.y), 0.0, cos(rotation.y), 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

/**
 * gets the camera transform used for lighting computations
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
 * transforms the texture coordinates based on
 * scale and transformation
 */
vec2 getTransformedUvs()
{
    mat2 uvTransform = mat2(scale.z, 0.0, 0.0, scale.y);
    if (rotation.y != 0.0)
    {
        uvTransform = mat2(scale.x, 0.0, 0.0, scale.y);
    }
    if (rotation.z != 0.0)
    {
        uvTransform = mat2(scale.x, 0.0, 0.0, scale.z);
    }
    return uvTransform * (uvs + offset.xy);
}

/**
 * gets the correct texture based on
 * rotation and position of the instance
 */
int chooseTexture()
{
    int chosenTexture = 0;
    if (rotation.z != 0.0) {
        chosenTexture = 1;
        if (scale.y == 0.1) {
            chosenTexture = 2;
        }
    }
    if (isCeiling())
    {
        chosenTexture = 0;
    }
    return chosenTexture;
}

/**
 * decides whether or not to render wall instance
 */
void decideRendering()
{
    alpha = 1.0;
    render = 1;
    if (overFloor() || (isolateFloor == 1 && underCeiling()))
    {
        render = 0;
    }
    if (wallTransparency == 1) {
        if (underFloor() && overCeiling()) {
            alpha = 0.5;
            if (normalize(normal) != vec3(1.0, 0.0, 0.0)) {
                render = 0;
            }
        }
    }
}

void main()
{
    mat4 camTrans = getCameraTransform();
    mat4 transform = getTransform();
    
    gl_Position = projMat * viewMat * ((transform * vec4(position, 1.0)) + vec4(offset, 0.0));

    vNormal = normalize(vec3(camTrans * transform * vec4(normal, 1.0)));
    vPosition = vec3(camTrans * transform * vec4(position, 1.0));
    vLightPos = vec3(0.0, 5.0, 5.0);

    decideRendering();

    vUvs = getTransformedUvs();
    vTexture = chooseTexture();
}