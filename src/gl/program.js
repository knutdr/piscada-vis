/**
 * Takes care of getting shader programs
 */
import vSrc from '../shaders/default.vert';
import fSrc from '../shaders/default.frag';
import pVSrc from '../shaders/part.vert';
import pFSrc from '../shaders/part.frag';
import wVSrc from '../shaders/wall.vert';
import wFSrc from '../shaders/wall.frag';
import bPVSrc from '../shaders/build-part.vert';
import bPFSrc from '../shaders/build-part.frag';

/**
 * creates shader programs for the application
 * compiles all shaders first and then links all programs in attempt to
 * optimize the compilation/linking process
 *
 * compiling shaders and linking the programs in 'series' is slower
 *
 * @param {ctx} gl webgl context
 * @param {Object} defaultVars the variables of default shader program
 * @param {Object} particleVars  vars for particle shader program
 * @param {Object} wallVars vars for wall shader program
 * @param {Object} buildingParticleVars  vars for building particle shader program
 *
 * @returns {Object} info about all the shader programs programs
 */
const shaderPrograms = (
    gl,
    defaultVars,
    particleVars,
    wallVars,
    buildingParticleVars,
) => {
    // create shaders
    const shaders = [];
    // create one of each shader per program
    shaders.push(gl.createShader(gl.VERTEX_SHADER));
    shaders.push(gl.createShader(gl.FRAGMENT_SHADER));
    shaders.push(gl.createShader(gl.VERTEX_SHADER));
    shaders.push(gl.createShader(gl.FRAGMENT_SHADER));
    shaders.push(gl.createShader(gl.VERTEX_SHADER));
    shaders.push(gl.createShader(gl.FRAGMENT_SHADER));
    shaders.push(gl.createShader(gl.VERTEX_SHADER));
    shaders.push(gl.createShader(gl.FRAGMENT_SHADER));
    // get shader source from the imports
    gl.shaderSource(shaders[0], vSrc);
    gl.shaderSource(shaders[1], fSrc);
    gl.shaderSource(shaders[2], pVSrc);
    gl.shaderSource(shaders[3], pFSrc);
    gl.shaderSource(shaders[4], wVSrc);
    gl.shaderSource(shaders[5], wFSrc);
    gl.shaderSource(shaders[6], bPVSrc);
    gl.shaderSource(shaders[7], bPFSrc);
    // compile shaders
    shaders.forEach((shader, index) => {
        gl.compileShader(shader);
        // check if saul goodman
        const subIName = index < 6 ? 'wall' : 'building-particle';
        const subName = index < 4 ? 'particle' : subIName;
        const name = index < 2 ? 'default' : subName;
        const shT = index === 0 || index === 2 || index === 4 || index === 6 ? 'vertex' : 'fragment';
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`error compiling shader of type ${shT} for program ${name}: ${gl.getShaderInfoLog(shader)}`);
        }
    });
    // create programs
    const programs = {
        default: {
            program: gl.createProgram(),
        },
        particle: {
            program: gl.createProgram(),
        },
        wall: {
            program: gl.createProgram(),
        },
        buildingParticle: {
            program: gl.createProgram(),
        },
    };
    // attach shaders to relevant programs
    gl.attachShader(programs.default.program, shaders[0]);
    gl.attachShader(programs.default.program, shaders[1]);
    gl.attachShader(programs.particle.program, shaders[2]);
    gl.attachShader(programs.particle.program, shaders[3]);
    gl.attachShader(programs.wall.program, shaders[4]);
    gl.attachShader(programs.wall.program, shaders[5]);
    gl.attachShader(programs.buildingParticle.program, shaders[6]);
    gl.attachShader(programs.buildingParticle.program, shaders[7]);
    // link the programs
    gl.linkProgram(programs.default.program);
    gl.linkProgram(programs.particle.program);
    gl.linkProgram(programs.wall.program);
    gl.linkProgram(programs.buildingParticle.program);

    // check if saul goodman
    if (!gl.getProgramParameter(programs.default.program, gl.LINK_STATUS)) {
        console.error('error linking default program');
    }
    if (!gl.getProgramParameter(programs.particle.program, gl.LINK_STATUS)) {
        console.error('error linking particle program');
    }
    if (!gl.getProgramParameter(programs.wall.program, gl.LINK_STATUS)) {
        console.error('error linking wall program');
    }
    if (!gl.getProgramParameter(programs.buildingParticle.program, gl.LINK_STATUS)) {
        console.error('error linking wall program');
    }

    /**
     * get the attribute/uniform (variables in shaders) locations for each program
     * so we have them for later
     */
    programs.default.attribLoc = getAttLocs(gl, programs.default.program, defaultVars.att);
    programs.default.uniformLoc = getULocs(gl, programs.default.program, defaultVars.uni);

    programs.particle.attribLoc = getAttLocs(gl, programs.particle.program, particleVars.att);
    programs.particle.uniformLoc = getULocs(gl, programs.particle.program, particleVars.uni);

    programs.wall.attribLoc = getAttLocs(gl, programs.wall.program, wallVars.att);
    programs.wall.uniformLoc = getULocs(gl, programs.wall.program, wallVars.uni);

    programs.buildingParticle.attribLoc = getAttLocs(
        gl,
        programs.buildingParticle.program,
        buildingParticleVars.att,
    );
    programs.buildingParticle.uniformLoc = getULocs(
        gl,
        programs.buildingParticle.program,
        buildingParticleVars.uni,
    );

    return programs;
};

/**
 * helper function to get the uniform locations of a shader program
 *
 * @param {ctx} gl webgl context
 * @param {WebglProgram} program a webgl shader program
 * @param {Array} uNames names of uniforms
 *
 * @returns {Object} location of the uniforms
 */
const getULocs = (gl, program, uNames) => {
    const uLocs = {};
    uNames.forEach((uName) => {
        // for every uniform name the location from the program
        uLocs[uName] = gl.getUniformLocation(program, uName);
    });
    return uLocs;
};

/**
 * helper function to get the attribute locations of a shader program
 *
 * @param {ctx} gl webgl context
 * @param {WebglProgram} program shader program
 * @param {Array} aNames names of the attributes
 *
 * @returns {Object} the attribute locations
 */
const getAttLocs = (gl, program, aNames) => {
    const aLocs = {};
    aNames.forEach((aName) => {
        // for every attribute name get the location from the program
        aLocs[aName] = gl.getAttribLocation(program, aName);
    });
    return aLocs;
};

export default shaderPrograms;
