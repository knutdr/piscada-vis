/**
 * Loads and compiles shaders
 *
 */

/**
 * compiles and links a shader program
 *
 * @param {context} gl webgl context
 * @param {String} vSrc source of a vertex shader
 * @param {String} fSrc source of a fragment shader
 *
 * @returns {WebglProgram} the compiled and linked shader program
 */
const initShaderProgram = (gl, vSrc, fSrc) => {
    const vShader = loadShader(gl, gl.VERTEX_SHADER, vSrc);
    const fShader = loadShader(gl, gl.FRAGMENT_SHADER, fSrc);

    // create program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);

    // check if saul goodman
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(`There was an error initializing the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }

    return shaderProgram;
};

/**
 * creates and compiles a shader
 *
 * @param {ctx} gl webgl context
 * @param {String} type type of shader (e.g gl.VERTEX_SHADER, gl.FRAGMENT_SHADER)
 * @param {String} src source of the shader
 *
 * @returns {WebglShader} the shader
 */
const loadShader = (gl, type, src) => {
    const shader = gl.createShader(type);
    // send src to shdr obj
    gl.shaderSource(shader, src);

    // compile
    gl.compileShader(shader);

    const name = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';

    // check if saul goodman
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(`There was an error compiling the shader of type ${name}: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
};

export default initShaderProgram;
