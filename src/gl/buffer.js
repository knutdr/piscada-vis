/**
 * Buffer init
 */

/**
 * initializes packed buffers for attributes
 * packed means that it puts position/normal/texture-coords/colors into
 * same buffer
 *
 * @param {ctx} gl webgl context
 * @param {*} programInfo info about the shader program
 * @param {Array} data vertex data
 * @param {Array} indices indice data
 *
 * @returns {Object} buffers for the data and the indices
 */
export const initPackedBuffer = (gl, programInfo, data, indices) => {
    // put in the data
    gl.useProgram(programInfo.program);
    const dBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(data),
        gl.STATIC_DRAW,
    );

    // indices
    const iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW,
    );

    return {
        data: dBuffer,
        indices: iBuffer,
    };
};

/**
 * initializes buffers to hold particle data
 * holds sonar data in its own buffer so it's a special case
 *
 * @param {ctx} gl webgl context
 * @param {Object} programInfo info about the shader program to use
 * @param {Object} mesh mesh data
 * @param {Array} position the positional data of all the particles
 * @param {Array} sonarColors the sonar colors for all the particles
 *
 * @returns {Object} the initialized buffers
 */
export const initParticleBuffer = (gl, programInfo, mesh, position, sonarColors) => {
    // tell webgl which program we are using
    gl.useProgram(programInfo.program);
    // create buffer for position/normals of the particle model
    const dBuffer = gl.createBuffer();
    // bind the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, dBuffer);
    // send the data to the buffer on the gpu
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(mesh.data),
        gl.STATIC_DRAW,
    );
    // indices
    const iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(mesh.indices),
        gl.STATIC_DRAW,
    );

    // create buffer for data about instances of the model
    const pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    // send the data to the buffer on the gpu
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

    // create buffer data about the colors of the instances with sonar colors
    const sBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sonarColors), gl.STATIC_DRAW);

    return {
        data: dBuffer,
        indices: iBuffer,
        offset: pBuffer,
        sonar: sBuffer,
    };
};

/**
 * inits a packed buffers for instance drawing
 *
 * @param {ctx} gl webgl context
 * @param {*} programInfo info about the shader program to use
 * @param {*} mesh mesh data
 * @param {*} instanceData data for the instances
 *
 * @returns {Object} the buffers
 */
export const initPackedInstancedBuffer = (
    gl,
    programInfo,
    mesh,
    instanceData,
) => {
    // make sure we're using the correct shader program
    gl.useProgram(programInfo.program);
    // create buffers
    // data buffer
    const dBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(mesh.data),
        gl.STATIC_DRAW,
    );

    // indices buffer
    const iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(mesh.indices),
        gl.STATIC_DRAW,
    );

    // buffer holding instance data
    const instBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(instanceData),
        gl.STATIC_DRAW,
    );

    return {
        data: dBuffer,
        indices: iBuffer,
        instance: instBuffer,
    };
};

/**
 * function for creating attributes for a buffer
 *
 * @param {ctx} gl webgl context
 * @param {Object} programInfo shader program info
 * @param {WebGLBuffer} buffer buffer to create attributes for
 * @param {Object} attributes attributes and info about them
 * @param {Number} divisor if it's instanced we need a divisor
 *
 * @returns {undefined}
 */
export const createAttributes = (
    gl,
    programInfo,
    buffer,
    attributes,
    divisor = 0,
) => {
    // get how many bytes we jump per vertex
    const stride = getStride(attributes);
    let offset = 0;
    // bind the buffer we are working on
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    Object.keys(attributes).forEach((aName) => {
        // get the attribute size and location
        const attribute = attributes[aName];
        const attribLoc = programInfo.attribLoc[aName];
        // enable the attribute pointer
        gl.enableVertexAttribArray(programInfo.attribLoc[aName]);
        // define the attribute pointer
        gl.vertexAttribPointer(
            attribLoc, // location
            attribute.size, // how many numbers
            gl.FLOAT, // type of numbers
            false, // normalized or not?
            stride, // how many bytes to jump ahead per vertex
            offset, // offset of attribute
        );
        // increment attribute offset
        offset += attribute.size * 4;
        /**
         * if we are drawing instances we need to define how many
         * jump per time
         */
        if (divisor > 0) {
            gl.vertexAttribDivisor(attribLoc, divisor);
        }
    });
};

/**
 * helper function to figure out stride size
 *
 * @param {Object} attributes the attributes to find stride for
 *
 * @returns {Number} the stride of the attributes in the packed buffer
 */
const getStride = (attributes) => {
    let stride = 0;
    Object.keys(attributes).forEach((aName) => {
        // every attribute size times 4 (size of float)
        stride += 4 * attributes[aName].size;
    });
    return stride;
};
