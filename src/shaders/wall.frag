#version 300 es 
precision mediump float;
precision mediump int;

in vec3 vPosition;
in vec3 vNormal;

in vec3 vLightPos;
in vec2 vUvs;

flat in int vTexture;
flat in int render;
flat in float alpha;

uniform sampler2D samplers[3];
uniform int useTexture;

out vec4 fragmentColor;

/**
 * gets the intensity of the diffuse/ambient lighting
 */
vec3 getLightInt()
{
    // lighting variables
    vec3 normal = normalize(vNormal);
    vec3 lightCol = vec3(0.8);
    float ambLightInt = 0.5;

    // calculate the lighting
    vec3 lightDir = normalize(vLightPos - vPosition);
    float diffLightInt = max(dot(normal, lightDir), 0.0);
    return lightCol * (ambLightInt + diffLightInt);
}

/**
 * chooses the color of the fragment based
 * on the texture if it is enabled,
 * or a default color if not
 */
vec3 chooseColor()
{
    if (useTexture == 1)
    {
        vec3 textureColor;
        if (vTexture == 0)
        {
            textureColor = vec3(texture(samplers[0], vUvs));
        } else if(vTexture == 1)
        {
            textureColor = vec3(texture(samplers[1], vUvs));
        } else
        {
            textureColor = vec3(texture(samplers[2], vUvs));
        }
        return textureColor;
    } else {
        return vec3(0.4);
    }
}

void main()
{
    if(render == 1)
    {

        vec3 lightInt = getLightInt();
        vec3 color = chooseColor();

        fragmentColor = vec4(lightInt * color, alpha);
    } else
    {
        discard;
    }
}