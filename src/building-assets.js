import { parseObjFilePacked } from './gl/mesh';
import { initPackedInstancedBuffer } from './gl/buffer';
import loadTexture from './gl/texture';
import {
    buildingParticleSettings,
    wallSettings,
    buildings,
    state,
} from './state';
import { Modes } from './constants';

import wallTexture from '../res/textures/repeating-bricks.jpeg';
import floorTexture from '../res/textures/floor.png';
import grassTexture from '../res/textures/grass.jpeg';
import wallNormalMap from '../res/textures/repeating-bricks-normalmap.png';
import floorNormalMap from '../res/textures/floor-normalmap.png';
import grassNormalMap from '../res/textures/grass-normalmap.png';

/**
 * helper function for constructing rooms based on building outline object
 *
 * uses just one model for walls and calculates their position based on the outline
 *
 * @param {Array} buildingOutline array with outline for each floor
 *
 * @returns {Array} wall nodes and data to pass to the gpu
 */
export const createRooms = (buildingOutline) => {
    // vars
    const walls = [];
    const data = [];
    const wallPartWidth = wallSettings.originalScale.x;
    const wallPartDepth = wallSettings.originalScale.z;

    // create the ground plane
    const planeOffset = [0.0, -0.25, 0.0];
    const planeRotation = [0.0, 0.0, Math.PI / 2.0];
    const planeScale = [20.0, 0.1, 20.0];
    walls.push({
        position: planeOffset,
        rotation: planeRotation,
        scale: planeScale,
    });
    data.push(...planeOffset);
    data.push(...planeRotation);
    data.push(...planeScale);

    // loop through every floor outline
    buildingOutline.forEach((wallOutline, floor) => {
        // how many wall models to draw in width/depth direction
        const wallDimensions = {
            width: buildingOutline[floor].facing.length,
            depth: buildingOutline[floor].right.length,
        };
        // how big is the floor of this floor, width/depth
        const floorScale = {
            width: (wallDimensions.width * wallPartWidth - 2 * wallPartDepth)
                / wallPartWidth,
            depth: (wallDimensions.depth * wallPartWidth) / wallPartWidth,
        };
        // calculate the position offset for the floor
        const floorOffset = [
            0.0,
            floor * wallPartWidth - 0.5 * wallPartWidth + 0.5 * wallPartDepth,
            0.0,
        ];
        // calculate the position offset for the ceiling
        const ceilOffset = [
            0.0,
            floor * wallPartWidth + 0.5 * wallPartWidth - 0.5 * wallPartDepth,
            0.0,
        ];
        // the floor/ceiling uses the wall model so it needs to be rotated to be lying
        const floorRotation = [0.0, 0.0, Math.PI / 2];

        /**
         * the floor might have floating set
         * and need to change the offset based on this
         */
        const fOffset = [0.0, 0.0, 0.0];
        const lastFloorWidth = buildingOutline[Math.max(floor - 1, 0)].facing.length;
        const lastFloorDepth = buildingOutline[Math.max(floor - 1, 0)].right.length;

        /**
         * if this floor is smaller than the last one check the float setting
         * and add offset to move all the walls + ceiling/floor
         */
        if (wallDimensions.width < lastFloorWidth) {
            // get the difference between this floor and the last
            const widthDiff = lastFloorWidth - wallDimensions.width;
            // change the x offset based on the floating setting
            if (wallOutline.xFloat === 'left') {
                fOffset[0] = -widthDiff * 0.5 * wallPartWidth;
            } else {
                fOffset[0] = widthDiff * 0.5 * wallPartWidth;
            }
            fOffset[0] += wallOutline.xOffset;
        }
        if (wallDimensions.depth < lastFloorDepth) {
            const depthDiff = lastFloorDepth - wallDimensions.depth;
            // change the z offset based on the floating setting
            if (wallOutline.zFloat === 'back') {
                fOffset[2] = -depthDiff * 0.5 * wallPartWidth;
            } else {
                fOffset[2] = depthDiff * 0.5 * wallPartWidth;
            }
            fOffset[2] += wallOutline.zOffset;
        }
        /**
         * additional offset setting
         * for floor should be added after float
         *
         * this offset setting allows for more detailed positioning
         * of floors
         */
        ceilOffset[0] += fOffset[0];
        ceilOffset[2] += fOffset[2];
        floorOffset[0] += fOffset[0];
        floorOffset[2] += fOffset[2];

        /**
         * push in data for floor and ceiling
         *
         * the instanced attributes are offset, rotation and scale.
         * they all need to be present
         */
        walls.push({
            position: floorOffset,
            rotation: floorRotation,
            scale: floorScale,
        });
        data.push(...floorOffset);
        data.push(...floorRotation);
        data.push(...[floorScale.width, 1.0, floorScale.depth]);
        walls.push({
            position: ceilOffset,
            rotation: floorRotation,
            scale: floorScale,
        });
        data.push(...ceilOffset);
        data.push(...floorRotation);
        data.push(...[floorScale.width, 1.0, floorScale.depth]);

        // get the wall outline for the floor
        let wallConst = Object.keys(wallOutline);
        // we need to remove the 4 first because they define float/offset
        wallConst = wallConst.slice(4, wallConst.length);

        // loop through all the walls of this floor
        wallConst.forEach((wall) => {
            // calculate the rotation of the wall model based on which side of the floor it is on
            const wallRotation = wall === 'facing' || wall === 'back' ? [0.0, Math.PI / 2, 0.0] : [0.0, 0.0, 0.0];
            // loop through all wallsegments of this wall
            wallOutline[wall].forEach((wallPartition, index) => {
                // define default wall offset / scale
                let offset = [0.0, 0.0, 0.0];
                let wallScale = [1.0, 1.0, 1.0];
                /**
                 * what kind of offset the wall segment has depends on which wall the segment is on.
                 *
                 * the center of the wall model starts out at the origin
                 * rotated so that the width is on the
                 * z-axis, the depth is the x-axis and the height is the y axis.
                 */
                switch (wall) {
                case 'facing':
                    offset = [
                        -0.5 * wallDimensions.width * wallPartWidth
                        + 0.5 * wallPartWidth + fOffset[0],
                        floor * wallPartWidth,
                        wallDimensions.depth * 0.5 * wallPartWidth
                        + 0.5 * wallPartDepth + fOffset[2],
                    ];
                    offset[0] += index * wallPartWidth;
                    break;
                case 'back':
                    offset = [
                        -0.5 * wallDimensions.width * wallPartWidth
                        + 0.5 * wallPartWidth + fOffset[0],
                        floor * wallPartWidth,
                        -wallDimensions.depth * 0.5 * wallPartWidth
                        - 0.5 * wallPartDepth + fOffset[2],
                    ];
                    offset[0] += index * wallPartWidth;
                    break;
                case 'left':
                    offset = [
                        -wallDimensions.width * 0.5 * wallPartWidth
                        + 0.5 * wallPartDepth + fOffset[0],
                        floor * wallPartWidth,
                        0.5 * wallDimensions.depth * wallPartWidth
                        - 0.5 * wallPartWidth + fOffset[2],
                    ];
                    offset[2] -= index * wallPartWidth;
                    break;
                default:
                    offset = [
                        wallDimensions.width * 0.5 * wallPartWidth
                        - 0.5 * wallPartDepth + fOffset[0],
                        floor * wallPartWidth,
                        0.5 * wallDimensions.depth * wallPartWidth
                        - 0.5 * wallPartWidth + fOffset[2],
                    ];
                    offset[2] -= index * wallPartWidth;
                    break;
                }

                /**
                 * if the wall segment contains a window it needs to be
                 * built out of smaller wall segments
                 *
                 * here the offset for these smaller ones is calculated
                 * based on the offset current offset of the wall segment
                 */
                if (wallPartition.wallType === 'window') {
                    /**
                     * split wall segment into two equal over/under the window.
                     *
                     * these segments has the same offset that a normal wall
                     * segment would have had.
                     * this is because the offset is calculated from the center of
                     * the model
                     */
                    const lowerOffset = [
                        offset[0],
                        offset[1] - 0.5 * wallPartWidth
                        + 0.5 * wallPartition.size[1] * wallPartWidth,
                        offset[2],
                    ];
                    const upperOffset = [
                        offset[0],
                        offset[1] + 0.5 * wallPartWidth
                        - 0.5 * wallPartition.size[1] * wallPartWidth,
                        offset[2],
                    ];
                    // the sides of the window has different scale and offset
                    let sideScale;
                    let leftOffset;
                    let rightOffset;
                    /**
                     * the offset of the walls on the side of the
                     * window need to change the offset from what
                     * a normal wall segment would have.
                     *
                     * how this is done depends on if the window
                     * is on a facing/back wall or on the left/right wall
                     */
                    if (wall === 'facing' || wall === 'back') {
                        wallScale = [
                            wallPartition.size[0],
                            wallPartition.size[1],
                            1.0,
                        ];
                        sideScale = [
                            (1 - wallScale[0]) / 2,
                            1.0,
                            1.0,
                        ];
                        leftOffset = [
                            offset[0] - 0.5 * wallPartWidth + 0.5 * sideScale[0] * wallPartWidth,
                            offset[1],
                            offset[2],
                        ];
                        rightOffset = [
                            offset[0] + 0.5 * wallPartWidth - 0.5 * sideScale[0] * wallPartWidth,
                            offset[1],
                            offset[2],
                        ];
                    } else {
                        wallScale = [
                            1.0,
                            wallPartition.size[1],
                            wallPartition.size[0],
                        ];
                        sideScale = [
                            1.0,
                            1.0,
                            (1 - wallScale[2]) / 2,
                        ];
                        leftOffset = [
                            offset[0],
                            offset[1],
                            offset[2] - 0.5 * wallPartWidth + 0.5 * sideScale[2] * wallPartWidth,
                        ];
                        rightOffset = [
                            offset[0],
                            offset[1],
                            offset[2] + 0.5 * wallPartWidth - 0.5 * sideScale[2] * wallPartWidth,
                        ];
                    }
                    // push the data for the window wall segments
                    walls.push({
                        position: leftOffset,
                        rotation: wallRotation,
                        scale: sideScale,
                    });
                    data.push(...leftOffset);
                    data.push(...wallRotation);
                    data.push(...sideScale);
                    walls.push({
                        position: rightOffset,
                        rotation: wallRotation,
                        scale: sideScale,
                    });
                    data.push(...rightOffset);
                    data.push(...wallRotation);
                    data.push(...sideScale);
                    walls.push({
                        position: lowerOffset,
                        rotation: wallRotation,
                        scale: wallScale,
                    });
                    data.push(...lowerOffset);
                    data.push(...wallRotation);
                    data.push(...wallScale);
                    walls.push({
                        position: upperOffset,
                        rotation: wallRotation,
                        scale: wallScale,
                    });
                    data.push(...upperOffset);
                    data.push(...wallRotation);
                    data.push(...wallScale);
                } else {
                    // push the data for a normal wall segment
                    walls.push({
                        position: offset,
                        rotation: wallRotation,
                        scale: wallScale,
                    });
                    data.push(...offset);
                    data.push(...wallRotation);
                    data.push(...wallScale);
                }
            });
        });
    });
    return [walls, data];
};

/**
 * creates the assets for walls
 *
 * @param {ctx} gl webgl context
 * @param {Object} programInfo info about the shader program
 *
 * @returns {Object} the wall scenenode
 */
export const createWallAssets = (
    gl,
    programInfo,
) => {
    // const wallObj = require('../res/models/wall-textured.obj');
    const wallObj = require('../res/models/wall-textured.obj');
    const wallMesh = parseObjFilePacked(wallObj.default, [], true);
    // create walls object
    const walls = {
        nodes: [],
        vaoId: -1,
        vaoCount: wallMesh.indices.length,
        instanceData: [],
        texture: null,
    };
    // generate the wall data
    [walls.nodes, walls.instanceData] = createRooms(buildings[state.activeBuilding]);

    // create and fill buffers for walls
    walls.vaoId = initPackedInstancedBuffer(
        gl,
        programInfo,
        wallMesh,
        walls.instanceData,
    );
    // attach data and textures to the walls node
    walls.data = wallMesh.data;
    walls.wallTexture = loadTexture(gl, wallTexture);
    walls.floorTexture = loadTexture(gl, floorTexture);
    walls.grassTexture = loadTexture(gl, grassTexture);
    return walls;
};

/**
 * gets the maximum floor width of the active floor in the active building
 *
 * max distance means how far away two particles can be from each other.
 * this is needed on the shader to calcuate the color of the
 * particle based on its distance from a hotspot.
 * the max distance is needed for the color map function.
 *
 * @returns {Number} the maximum distance two building particles can have
 *                   to each other
 */
export const getMaxDistance = () => {
    let maxDistance = 0.0;
    buildings[state.activeBuilding].forEach((floorOutline) => {
        const floorSize = getFloorSize(floorOutline);
        maxDistance = floorSize.width > maxDistance ? floorSize.width : maxDistance;
    });
    return maxDistance * wallSettings.originalScale.x;
};

/**
 * helper function to figure out the size of the space to
 * fill with the particles
 *
 * @param {Object} floorOutline the floor outline
 *
 * @returns {Object} the size of the floor
 */
export const getFloorSize = (floorOutline) => ({
    width: floorOutline.facing.length,
    height: wallSettings.originalScale.y - 2.0 * wallSettings.originalScale.z,
    depth: floorOutline.right.length,
});

/**
 * helper function to get the offset of the particles on a certain floor
 *
 * @param {Number} floor the floor
 * @param {Number} floorSize size of the floor
 * @param {Number} lastFloorSize size of the floor under this one
 * @param {String} xFloat the float setting in the x direction
 * @param {String} zFloat the float setting in the z direction
 * @param {Number} xOffset the offset in the x direction
 * @param {Number} zOffset the offset in the z direction
 * @param {Number} particleSize the size of a particle
 * @param {Number} wallPartSize the size of a wall partition in the x direction
 *
 * @returns {Array} the floor offset
 */
export const getFloorOffset = (
    floor,
    floorSize,
    lastFloorSize,
    xFloat,
    zFloat,
    xOffset,
    zOffset,
    particleSize,
    wallPartSize,
) => {
    const offset = [
        -(floorSize.width * wallSettings.originalScale.x - 2.0 * wallSettings.originalScale.z)
        / 2.0 + 0.5 * particleSize,
        floor * floorSize.height - 0.5 * wallPartSize
        + floor * 2.0 * wallSettings.originalScale.z + particleSize,
        (floorSize.depth * wallSettings.originalScale.x) / 2.0 - 0.5 * particleSize,
    ];
    if (floorSize.width < lastFloorSize.width) {
        // fix offset for floating floor in x direction
        const widthDiff = lastFloorSize.width - floorSize.width;
        if (xFloat === 'back') {
            // add to offset for floating back
            offset[0] += widthDiff * 0.5 * wallPartSize;
        } else {
            // add to offset for floating front
            offset[0] -= widthDiff * 0.5 * wallPartSize;
        }
    }
    if (floorSize.depth < lastFloorSize.depth) {
        const depthDiff = lastFloorSize.depth - floorSize.depth;
        // fix offset for floating floor in z direction
        if (zFloat === 'left') {
            // add to offset for floating left
            offset[2] -= depthDiff * 0.5 * wallPartSize;
        } else {
            // add to offset for floating right
            offset[2] += depthDiff * 0.5 * wallPartSize;
        }
    }
    // add x/z-offset
    offset[0] += xOffset;
    offset[1] += zOffset;
    return offset;
};

/**
 * helper function to determine how many layers to generate
 *
 * @param {Number} particleHeight the height of the particle
 * @param {Number} floorHeight the height of the space to fill
 *
 * @returns {Number} how many layers of particles to generate per floor
 */
const getNumLayers = (particleHeight, floorHeight) => Math.floor(floorHeight / particleHeight);

/**
 * helper function to determine how many stripes of particles to generate
 * per layer
 *
 * @param {Number} particleDepth how deep the particle is
 * @param {Number} floorDepth how deep the floor is
 *
 * @returns {Number} how many stripes of particles to generate per layer
 */
const getStripesPerLayer = (particleDepth, floorDepth) => Math.floor(
    (floorDepth * wallSettings.originalScale.x) / particleDepth,
);

/**
 * helper function to determine how many particles to generate per stripe in a layer
 *
 * @param {Number} particleWidth the width of the particle
 * @param {Number} floorWidth the width of the floor
 *
 * @returns {Number} how many particles to generate per stripe
 */
const getParticlesPerStripe = (particleWidth, floorWidth) => Math.floor(
    (floorWidth * wallSettings.originalScale.x - 2.0 * wallSettings.originalScale.z)
    / particleWidth,
);

/**
 * generates the particles inside the active building
 *
 * @param {Array} buildingOutline outline of the building
 * @param {Number} floor the current floor
 *
 * @returns {Array} the particle scene nodes and the position data
 *                  to pass to the gpu
 */
export const generateParticles = (buildingOutline, floor) => {
    const nodes = [];
    const data = [];
    const particleSize = buildingParticleSettings.originalScale
        * buildingParticleSettings.scale;
    const wallPartSize = wallSettings.originalScale.x;
    const floorOutline = buildingOutline[floor];
    const lastFloorSize = {
        width: buildingOutline[Math.max(floor - 1, 0)].facing.length,
        depth: buildingOutline[Math.max(floor - 1, 0)].right.length,
    };
    const floorSize = getFloorSize(floorOutline);
    const floorOffset = getFloorOffset(
        floor,
        floorSize,
        lastFloorSize,
        floorOutline.xFloat,
        floorOutline.zFloat,
        floorOutline.xOffset,
        floorOutline.zOffset,
        particleSize,
        wallPartSize,
    );
    const layers = getNumLayers(
        particleSize,
        floorSize.height,
    );
    const stripesPerLayer = getStripesPerLayer(
        particleSize,
        floorSize.depth,
    );
    const particlesPerStripe = getParticlesPerStripe(
        particleSize,
        floorSize.width,
    );
    for (let layer = 0; layer < layers; layer++) {
        for (let stripe = 0; stripe < stripesPerLayer - 1; stripe++) {
            for (let particle = 0; particle < particlesPerStripe - 1; particle++) {
                // create the particle
                const particleOffset = [
                    floorOffset[0]
                        + (particle % particlesPerStripe) * particleSize + particleSize * 0.5,
                    floorOffset[1] + layer * particleSize + particleSize * 0.5,
                    floorOffset[2]
                        - (stripe % stripesPerLayer) * particleSize - particleSize * 0.5,
                ];
                nodes.push({
                    position: particleOffset,
                });
                data.push(...particleOffset);
            }
        }
    }
    state.buildingParticleCount = nodes.length;
    if (state.renderMode === Modes.ROOMS) {
        if (state.renderBuildingParticles) {
            state.pCountBox.innerHTML = `Particle count: ${state.buildingParticleCount}`;
        }
    }
    return [nodes, data];
};

/**
 * creates the particles inside the building to render
 * @param {ctx} gl webgl context
 * @param {Object} programInfo info about the shader program
 *
 * @returns {Object} the particle assets
 */
export const createBuildingParticles = (gl, programInfo) => {
    const particleObj = require('../res/models/building-particle.obj');
    const particleMesh = parseObjFilePacked(particleObj.default);
    const particles = {
        nodes: [],
        vaoId: -1,
        vaoCount: particleMesh.indices.length,
        data: [],
    };
    [particles.nodes,
        particles.data] = generateParticles(buildings[state.activeBuilding], state.floor - 1);
    particles.vaoId = initPackedInstancedBuffer(
        gl,
        programInfo,
        particleMesh,
        particles.data,
    );
    state.buildingParticleCount = particles.nodes.length;
    return particles;
};
