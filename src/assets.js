/**
 * file with functionality
 * connected to generating
 * objects
 */
import { heatMapCol, particleColorFromSonar } from './utils';
import { initPackedBuffer, initParticleBuffer } from './gl/buffer';
import {
    createWallAssets,
    createBuildingParticles,
} from './building-assets';
import * as SceneGraph from './gl/scenegraph';
import { Hotspot, generateBuildingHotspots } from './hotspot';
import { parseObjFilePacked } from './gl/mesh';
import {
    mSettings,
    particleLayers,
    state,
} from './state';
import { Modes } from './constants';

/**
 * gets all the assets from .obj files
 *
 * @param {ctx} gl webgl2 context
 * @param {Object} shaders info on the shader programs
 * @returns {Array} an array with the meshes to create
 */
export const createAssets = (gl, shaders) => {
    const nodes = [];
    // get the assets as meshes

    // get the outer pillar model and create buffers and scene nodes for it
    const outerPillObj = require('../res/models/outer-pillars.obj');
    const outerPillMesh = parseObjFilePacked(outerPillObj.default, [0.7, 0.9, 1.0, 0.5]);
    const outerPillVao = initPackedBuffer(
        gl,
        shaders.default,
        outerPillMesh.data,
        outerPillMesh.indices,
    );
    nodes.push(
        SceneGraph.SceneNode(
            [0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            [0.0, 0.0, 0.0],
            outerPillVao,
            outerPillMesh.indices.length,
            SceneGraph.GEOMETRY,
            [0.7, 0.9, 1.0],
            0.5,
        ),
    );

    // get the outer construction model and create buffers and scene nodes for it
    const outerConstructionObj = require('../res/models/outer-construction.obj');
    const outerConstructionMesh = parseObjFilePacked(
        outerConstructionObj.default, [0.4, 0.4, 0.4, 1.0],
    );
    const outerConstructionVao = initPackedBuffer(
        gl,
        shaders.default,
        outerConstructionMesh.data,
        outerConstructionMesh.indices,
    );
    nodes.push(
        SceneGraph.SceneNode(
            [0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            [0.0, 0.0, 0.0],
            outerConstructionVao,
            outerConstructionMesh.indices.length,
            SceneGraph.GEOMETRY,
            [0.4, 0.4, 0.4],
            1.0,
        ),
    );

    // get the heatmap layer model and manipulate them / create buffers and scene nodes for them
    const heatMapLayers = addHeatLayers(gl, shaders.default);

    /**
     * get the particle models and create buffers/ scene nodes
     * as well as spatially distributing them
     */
    const particles = createParticles(gl, shaders.particle);

    // get model for tank camera object and create buffers / scene node for it
    const tankCamObj = require('../res/models/cam.obj');
    const tankCamMesh = parseObjFilePacked(
        tankCamObj.default, [0.6, 0.6, 0.6, 1.0],
    );
    const tankCamVao = initPackedBuffer(
        gl,
        shaders.default,
        tankCamMesh.data,
        tankCamMesh.indices,
    );
    const tankCam = SceneGraph.SceneNode(
        [0.0, -0.08, 0.0],
        [0.0, 0.0, 0.0],
        [1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0],
        tankCamVao,
        tankCamMesh.indices.length,
        SceneGraph.GEOMETRY,
        [0.4, 0.4, 0.4],
        1.0,
    );

    // get the model for the vertical camera 'staff'
    const camStaffVertObj = require('../res/models/camStaffVert.obj');
    const camStaffVertMesh = parseObjFilePacked(
        camStaffVertObj.default, [0.4, 0.4, 0.4, 1.0],
    );
    const camStaffVertVao = initPackedBuffer(
        gl,
        shaders.default,
        camStaffVertMesh.data,
        camStaffVertMesh.indices,
    );
    const camStaffVert = SceneGraph.SceneNode(
        [0.0, -0.04, 0.0],
        [0.0, 0.0, 0.0],
        [1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0],
        camStaffVertVao,
        camStaffVertMesh.indices.length,
        SceneGraph.GEOMETRY,
        [0.4, 0.4, 0.4],
        1.0,
    );

    // the horisontal camera 'staff'
    const camStaffHorObj = require('../res/models/camStaffHor.obj');
    const camStaffHorMesh = parseObjFilePacked(
        camStaffHorObj.default, [0.4, 0.4, 0.4, 1.0],
    );
    const camStaffHorVao = initPackedBuffer(
        gl,
        shaders.default,
        camStaffHorMesh.data,
        camStaffHorMesh.indices,
    );
    const camStaffHor = SceneGraph.SceneNode(
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0],
        camStaffHorVao,
        camStaffHorMesh.indices.length,
        SceneGraph.GEOMETRY,
        [0.4, 0.4, 0.4],
        1.0,
    );

    /**
     * get the models for the walls and decide their location
     * create buffers and fill them
     */
    const walls = createWallAssets(
        gl,
        shaders.wall,
    );

    // create the particles for the building
    const buildingParticles = createBuildingParticles(gl, shaders.buildingParticle);

    // create hotspots in the building
    generateBuildingHotspots();

    // add all the nodes to the state so they are available later
    state.assets.nodes = nodes;
    state.assets.heatMapLayers = heatMapLayers;
    state.assets.particles = particles;
    state.assets.tankCam = tankCam;
    state.assets.camStaffVert = camStaffVert;
    state.assets.camStaffHor = camStaffHor;
    state.assets.walls = walls;
    state.assets.buildingParticles = buildingParticles;
    state.assets.net = getNetAsset(gl, shaders, state.useConical ? 'conical' : 'default');
};

/**
 * helper function to get the model for the net
 *
 * @param {WebGL2RenderingContext} gl webgl2 rendering context
 * @param {Object} shaders object with program info
 * @param {string} type type of net to use
 *
 * @returns {SceneNode} the scene node of the net
 */
export const getNetAsset = (gl, shaders, type) => {
    // gets the correct model for the net that is active
    let obj;
    if (type === 'default') {
        obj = require('../res/models/net.obj');
    } else {
        obj = require('../res/models/conical-net.obj');
    }
    // create mesh based on the object file
    const netMesh = parseObjFilePacked(obj.default, [0.7, 0.9, 1.0, 0.4]);
    // create buffers and fill them
    const netVao = initPackedBuffer(gl, shaders.default, netMesh.data, netMesh.indices);
    // return a scene node for the net
    return SceneGraph.SceneNode(
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0],
        netVao,
        netMesh.indices.length,
        SceneGraph.GEOMETRY,
        [0.7, 0.9, 1.0],
        0.4,
    );
};

/**
 * adds layers to show temperature in water
 * @param {ctx} gl webgl context
 * @param {*} programInfo info about the shader program
 *
 * @returns {Array} array of heatmap scenenodes
 */
const addHeatLayers = (gl, programInfo) => {
    const heatLayers = [];
    // get the model from the object file
    const heatmapObj = require('../res/models/sliced-heatmaplayer.obj');
    // create objects that before the net starts shrinking
    for (let i = 0; i < 40; i++) {
        // create the mesh with the color defined by the heatmap
        const heatmapMesh = parseObjFilePacked(
            heatmapObj.default, heatMapCol(0, 60, i).concat(1.0),
        );
        // create and fill buffers
        const heatmapVao = initPackedBuffer(gl, programInfo, heatmapMesh.data, heatmapMesh.indices);
        // add node
        heatLayers.push(
            SceneGraph.SceneNode(
                [0.0, -i * 0.06 * 0.23, 0.0],
                [0.0, -Math.PI / 4, 0.0],
                [1.03, 0.23, 1.03],
                [0.0, 0.0, 0.0],
                heatmapVao,
                heatmapMesh.indices.length,
                SceneGraph.TEXTURED,
                heatMapCol(0, 60, i),
                1.0,
            ),
        );
    }

    // create objects from the point that the net starts shrinking
    for (let i = 0; i < 20; i++) {
        // get the mesh based on the object file
        const heatmapMesh = parseObjFilePacked(
            heatmapObj.default,
            heatMapCol(0, 60, i + 40).concat(1.0),
        );
        // create and fill buffers
        const heatmapVao = initPackedBuffer(gl, programInfo, heatmapMesh.data, heatmapMesh.indices);
        // decide how much a layer should shrink based on how 'deep' it is
        const rad = 1.03 - i / 20;
        /**
         * this diminishing radius defines how
         * to scale the layer on each axis (x/y/z)
         *
         * in webgl the y axis is the one pointing up,
         * while xz defines the 'horisontal plane'
         */
        const scale = [rad, 0.23, rad];
        // put a scene node in the array
        heatLayers.push(
            SceneGraph.SceneNode(
                [0.0, -(i + 40) * 0.06 * 0.23, 0.0], // position of the layer
                [0.0, -Math.PI / 4, 0.0],
                scale,
                [0.0, 0.0, 0.0],
                heatmapVao,
                heatmapMesh.indices.length,
                SceneGraph.GEOMETRY,
                heatMapCol(0, 60, i + 40),
                1.0,
            ),
        );
    }
    return heatLayers;
};

/**
 * helper function to calculate how many rings of particles
 * to generate per layer if we are using a conical net
 *
 * NB!  the translation of the particles actually happens after we scale it.
 *      this means we need to apply the scaling when we calculate the position.
 *      if we don't do this, the position of the particle will be wrong.
 *
 * @param {number} layer which layer (depth) we are calculating for
 *
 * @returns {number} the number of rings
 */
const calculateRingsCone = (layer) => Math.floor(
    (mSettings.maxRho - layer * mSettings.particleRadius * mSettings.particleScale)
        / (2.0 * mSettings.particleRadius * mSettings.particleScale),
);

/**
 * helper function to calculate how many rings of particles
 * to generate per layer (depth) if we are using the default net shape
 *
 * NB!  the translation of the particles actually happens after we scale it.
 *      this means we need to apply the scaling when we calculate the position.
 *      if we don't do this, the position of the particle will be wrong.
 *
 * @param {number} layer which layer (depth) we are calculating for
 *
 * @returns {number} the number of rings to generate
 */
const calculateRingsDefault = (layer) => {
    // figure out at which height we start to decrement the net radius
    const decLayer = Math.round(
        mSettings.decreaseRingHeight / (2 * mSettings.particleScale * mSettings.particleRadius),
    );
    /**
     * if the current layer is higher (deeper) than the
     * decrementing layer we should change the radius
     */
    if (layer > decLayer) {
        return Math.floor(
            (mSettings.maxRho - (layer - decLayer)
            * 5.5 * mSettings.particleRadius * mSettings.particleScale)
            / (2 * mSettings.particleScale * mSettings.particleRadius),
        );
    }
    return Math.floor(mSettings.maxRho / (2 * mSettings.particleScale * mSettings.particleRadius));
};

/**
 * helper function to generate particles
 *
 * to distribute the particles on rings around the origin we use
 * polar coordinates
 *
 * NB!  the translation of the particles actually happens after we scale it.
 *      this means we need to apply the scaling when we calculate the position.
 *      if we don't do this, the position of the particle will be wrong.
 *
 * @returns {Array} array containing particle colors and particle scenenodes
 */
export const getParticles = () => {
    const nodes = [];
    // calculate how many layers of particles we should generate
    const layers = state.useConical
        ? Math.floor(2.0 / (2.0 * mSettings.particleRadius * mSettings.particleScale))
        : particleLayers();
    const colors = [];
    // how much space between each particle
    const deltaRho = 2 * mSettings.particleRadius;
    // generate the particles
    for (let layer = 1; layer <= layers; layer++) {
        // depth of the current layer
        const depth = -layer * deltaRho;
        // calculate how many rings of particles to generate
        const ringsPerLayer = state.useConical
            ? calculateRingsCone(layer) : calculateRingsDefault(layer);
        // be sure to stop the generation if there are no more particles to generate
        if (ringsPerLayer <= 0) {
            break;
        }
        for (let ring = 1; ring <= ringsPerLayer; ring++) {
            // radius from the ring of particles to the origin
            const rho = ring * deltaRho;
            // calculate how many particles to generate in this ring
            const ringParticles = Math.round((2 * Math.PI * rho) / (2 * mSettings.particleRadius));
            // calculate how much space there should be between particles
            const deltaTheta = ((2 * Math.PI) / ringParticles);
            for (let particle = 1; particle <= ringParticles; particle++) {
                // calculate theta for the current particle
                const theta = particle * deltaTheta;
                /**
                 * get the color of the particle if we are using sonar mode
                 *
                 * if we are using regular mode the color is calculated in the
                 * vertex shader on the gpu
                 */
                const color = particleColorFromSonar(
                    [
                        theta,
                        ring * 2 * mSettings.particleScale * mSettings.particleRadius,
                        depth],
                    state.sonarMap,
                );
                // put colors in the array
                colors.push(...color);
                // push the scene node of the particle in the array
                nodes.push(
                    {
                        position: [rho * Math.cos(theta), depth, rho * Math.sin(theta)],
                        polar: [
                            theta,
                            rho,
                            depth,
                        ],
                    },
                );
            }
        }
    }
    // generate random hotspots
    const hotspots = [];
    for (let i = 0; i < 10; i++) {
        const part = nodes[Math.floor(Math.random() * (nodes.length - 1))];
        hotspots.push(Hotspot(
            part.polar[0],
            part.polar[1],
            part.polar[2],
        ));
    }
    // add hotspots to the state
    state.hotSpots = hotspots;
    state.particleCount = nodes.length;
    // update the particle count
    if (state.renderMode === Modes.PARTICLES) {
        state.pCountBox.innerHTML = `particle count: ${nodes.length}`;
    }
    return [nodes, colors];
};

/**
 * creates particles to add to the scene
 * creates and fills buffers
 *
 * @param {ctx} gl webgl context
 * @param {Object} programInfo info about the shader program
 *
 * @returns {Array} the created particles
 */
const createParticles = (gl, programInfo) => {
    // get the model of the particle
    const particleObj = require('../res/models/particle.obj');
    const particleMesh = parseObjFilePacked(particleObj.default);
    // create object for nodes of the particles
    const particles = {
        nodes: [],
        vaoId: -1,
        vaoCount: particleMesh.indices.length,
    };
    // figure out the position of the particles
    [particles.nodes, particles.sonarColors] = getParticles();
    // get all data as float array to send to gpu
    const data = [];
    particles.nodes.forEach((particle) => {
        data.push(...particle.position);
    });
    // create and fill buffer on gpu
    particles.vaoId = initParticleBuffer(
        gl,
        programInfo,
        particleMesh,
        new Float32Array(data),
        new Float32Array(particles.sonarColors),
    );
    return particles;
};
