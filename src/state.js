import { Modes } from './constants';
/**
 * model settings
 */
export const mSettings = {
    waterHeight: 1.311,
    decreaseRingHeight: 0.5387,
    particleRadius: 0.02,
    particleScale: 0.7,
    maxRho: 0.95,
};

/**
 * calculates how many layers of particles the tank should have
 *
 * @returns {Number} number of layers in the fish farm
 */
export const particleLayers = () => {
    let layers = Math.floor(
        (mSettings.waterHeight - mSettings.decreaseRingHeight)
        / (2 * mSettings.particleScale * mSettings.particleRadius),
    );
    const decLayers = Math.floor(
        mSettings.decreaseRingHeight
        / (2 * mSettings.particleScale * mSettings.particleRadius),
    );
    let ringsPerLayer = Math.floor(
        mSettings.maxRho / (2 * mSettings.particleScale * mSettings.particleRadius),
    );
    for (let i = 0; i < decLayers; i++) {
        ringsPerLayer -= Math.floor(2 * (1 + mSettings.particleScale));
        if (ringsPerLayer <= 0) {
            break;
        }
        layers++;
    }
    return layers;
};

/**
 * settings for the wall model
 */
export const wallSettings = {
    originalScale: {
        x: 0.5,
        y: 0.5,
        z: 0.04,
    },
};

/**
 * settings for building particle model
 */
export const buildingParticleSettings = {
    originalScale: 0.04,
    scale: 1.0,
};

/**
 * generates a skyscraper building outline
 *
 * @param {number} floors how many floors to generate
 * @param {number} width how wide the building should be
 * @param {number} depth how deep the building should be
 *
 * @returns {Object} the building outline
 */
const genScrape = (floors, width, depth) => {
    width = width % 2 === 0 ? width + 1 : width;
    depth = depth % 2 === 0 ? depth + 1 : depth;
    const buildingOutline = [];
    for (let nFloor = 0; nFloor < floors; nFloor++) {
        const floorOutline = (() => {
            const outline = {
                xFloat: 'none',
                zFloat: 'none',
                xOffset: 0.0,
                zOffset: 0.0,
                facing: [],
                right: [],
                left: [],
                back: [],
            };
            for (let horPos = 1; horPos <= width; horPos++) {
                if (nFloor === 0 && horPos === Math.floor(width / 2) + 1) {
                    outline.facing.push({ wallType: 'window', size: [0.8, 0.04] });
                    outline.back.push({ wallType: 'wall' });
                } else if (horPos % 2 === 0) {
                    outline.facing.push({ wallType: 'window', size: [0.3, 0.2] });
                    outline.back.push({ wallType: 'window', size: [0.3, 0.2] });
                } else {
                    outline.facing.push({ wallType: 'wall' });
                    outline.back.push({ wallType: 'wall' });
                }
            }
            for (let depPos = 1; depPos <= depth; depPos++) {
                if (depPos % 2 === 0) {
                    outline.right.push({ wallType: 'window', size: [0.3, 0.2] });
                    outline.left.push({ wallType: 'window', size: [0.3, 0.2] });
                } else {
                    outline.right.push({ wallType: 'wall' });
                    outline.left.push({ wallType: 'wall' });
                }
            }
            return outline;
        })();
        buildingOutline.push(floorOutline);
    }
    return buildingOutline;
};

/**
 * outline of the buildings
 *
 * for every floor of the building the facing/back/right/left
 * walls need to be built up by wall segments.
 *
 * the xFloat/zFloat vars are there to deal with floors that are
 * smaller than the biggest floor size.
 * these floors can float in the two axis.
 *
 * the xOffset/zOffset vars are there for more detailed positioning
 * of floating floors. these are added to the offset AFTER the
 * floating.
 *
 * facing/back and right/left need to match up on size
 *
 * windows need and additional size param which define
 * how big the wall segments on the sides/top/bottom of the window should be
 * relative to the original scale of the wall segment.
 */
export const buildings = {
    scraper: genScrape(10, 15, 9),
    default: [
        {
            xFloat: 0,
            zFloat: 0,
            xOffset: 0,
            zOffset: 0,
            facing: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.9, 0.1] },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            right: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.1, 0.5] },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            left: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            back: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
        },
        {
            xFloat: 0,
            zFloat: 0,
            xOffset: 0,
            zOffset: 0,
            facing: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            right: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            left: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            back: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
        },
    ],
    experimental: [
        {
            xFloat: 0,
            zFloat: 0,
            xOffset: 0,
            zOffset: 0,
            facing: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
            ],
            right: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            left: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            back: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
        },
        {
            xFloat: 0,
            zFloat: 0,
            xOffset: 0,
            zOffset: 0,
            facing: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            right: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            left: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
            back: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
        },
        {
            xFloat: 'left',
            zFloat: 'front',
            xOffset: 0.0,
            zOffset: 0.0,
            facing: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.4, 0.2] },
                { wallType: 'window', size: [0.2, 0.5] },
                { wallType: 'wall' },
            ],
            right: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.9, 0.1] },
                { wallType: 'window', size: [0.5, 0.3] },
                { wallType: 'wall' },
            ],
            left: [
                { wallType: 'wall' },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
            ],
            back: [
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'window', size: [0.3, 0.2] },
                { wallType: 'wall' },
                { wallType: 'wall' },
            ],
        },
    ],
};

/**
 * state
 *
 * this is all of the state for
 * for sharing info between different functions
 * to avoid passing too many parameters.
 *
 * it also allows event handlers to directly communicate
 * with the updating/rendering functions
 *
 */
export const state = {
    changeInstanced: false,
    sonarMap: require('../res/data/sonar-test.json'),
    useSonarMap: false,
    stateChange: true,
    activeBuilding: 'default',
    isolateFloor: false,
    cycleFloor: false,
    wallTransparency: false,
    reset: false,
    renderMode: Modes.ROOMS,
    isDragging: false,
    isMoving: false,
    isMiddle: false,
    zoom: false,
    mouse: {
        startX: 0,
        startY: 0,
        x: 0,
        y: 0,
    },
    cameraInfo: {
        position: [0.0, 0.0, 5.0],
        rotation: [0.0, 0.0, 0.0],
    },
    rotation: [0.0, 0.0, 0.0],
    theta: [0.0, 2 * Math.PI + 0.02],
    rho: [0.0, mSettings.maxRho / mSettings.particleScale],
    depth: [0.0, -mSettings.waterHeight],
    floor: 2,
    exposeHotspots: false,
    useConical: true,
    changeTank: false,
    renderTank: true,
    isolateBuildingHotspots: false,
    buildingHotspotThreshold: 0.4,
    buildingHotspots: {
        default: [],
        experimental: [],
    },
    hotSpots: [],
    hotspotThreshold: 0.2,
    farmCamPos: [
        0.0,
        -0.055,
        0.0,
    ],
    farmCamRot: [
        0.0,
        0.0,
        0.0,
    ],
    consoleBox: document.createElement('div'),
    assets: {
        nodes: [],
        heatMapLayers: [],
        particles: [],
        tankCam: [],
        camStaffVert: [],
        camStaffHor: [],
        walls: [],
    },
    useBuildingTexture: false,
    particleCount: 0,
    buildingParticleCount: 0,
    renderBuildingParticles: false,
    activeFps: 1,
    fps: [
        1 / 5,
        1 / 10,
        1 / 15,
        1 / 20,
        1 / 30,
    ],
    fpsStr: [
        '1 / 5',
        '1 / 10',
        '1 / 15',
        '1 / 20',
        '1 / 30',
    ],
    buildingChange: false,
};
