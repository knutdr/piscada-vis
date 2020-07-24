/**
 * Loads a texture
 */

/**
 * loads a texture
 *
 * @param {ctx} gl webgl contet
 * @param {String} url url to texture image
 *
 * @returns {WebglTexture} the loaded texture
 */
const loadTexture = (gl, url) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel,
    );

    const loadTexErr = gl.getError();
    if (loadTexErr !== gl.NO_ERROR) {
        console.log(`There was an error creating the texture: ${loadTexErr}`);
    }

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    const loadImErr = gl.getError();
    if (loadImErr !== gl.NO_ERROR) {
        console.log(`There was an error loading the image into the texture: ${loadImErr}`);
    }
    image.src = url;

    return texture;
};

const isPowerOf2 = (val) => ((val & (val - 1)) === 0);

export default loadTexture;
