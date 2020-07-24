/**
 * code for initialization
 */
import Canvas from './elements/canvas';
import shaderPrograms from './gl/program';
import { createAssets, getParticles } from './assets';
import { Modes, Dimension } from './constants';
import { mSettings, buildings, state } from './state';
import favicon from '../static/favicon.png';
import { cartesianToPolar } from './utils';

/**
 * initializes all html components
 *
 * NB! not optimized at all for website rendering. Only for demo purposes.
 *
 * @returns {Array} gl context and compiled shader program info
 */
const initWindow = () => {
    // favicon
    const icon = document.createElement('link');
    icon.type = 'image/x-icon';
    icon.rel = 'shortcut icon';
    icon.href = favicon;
    document.getElementsByTagName('head')[0].appendChild(icon);

    const bod = document.body;
    bod.style.margin = 0;
    bod.style.backgroundColor = '#ddd';

    // disable select
    bod.style.setProperty('-moz-user-select', 'none');
    bod.style.setProperty('-webkit-user-select', 'none');
    bod.style.setProperty('-ms-user-select', 'none');
    bod.style.setProperty('user-select', 'none');
    bod.style.setProperty('-o-user-select', 'none');
    bod.setAttribute('unselectable', 'on');
    bod.onselectstart = () => false;
    bod.onmousedown = () => false;

    const cameraControls = createCameraControls();

    bod.appendChild(cameraControls);

    // console box
    state.consoleBox.style.position = 'absolute';
    state.consoleBox.style.display = 'block';
    state.consoleBox.style.right = `${0.85 * window.innerWidth + 30}px`;
    state.consoleBox.style.top = `${0.15 * Dimension.WIN_HEIGHT + 30}px`;
    state.consoleBox.style.color = '#fff';
    state.consoleBox.style.width = '200px';
    bod.appendChild(state.consoleBox);

    state.consoleBox.onclick = () => {
        cameraControls.style.display = state.renderMode === Modes.CAMERA ? 'block' : 'none';
        if (!state.wallTransparency) {
            wallTranButt.style.border = '1px solid #333';
        }
        if (!state.isolateFloor) {
            toggleFloorIsoButt.style.border = '1px solid #333';
        }
        if (!state.isolateBuildingHotspots) {
            buildHotIsoButt.style.border = '1px solid #333';
        }
    };

    const resetBuildingState = () => {
        state.buildingHotspotThreshold = 0.4;
        state.wallTransparency = false;
        state.isolateBuildingHotspots = false;
        state.isolateFloor = false;
        state.renderBuildingParticles = false;
        state.floor = buildings[state.activeBuilding].length;
    };

    // building mode button
    const buildButt = document.createElement('div');
    buildButt.innerHTML = 'Building mode';
    buildButt.onclick = () => {
        if (state.renderMode === Modes.PARTICLES) {
            state.changeInstanced = true;
        }
        state.renderMode = Modes.ROOMS;
        state.renderTank = false;
        state.stateChange = true;
        state.reset = true;
        state.pCountBox.innerHTML = `Particle count: ${state.buildingParticleCount}`;
        resetBuildingState();
        resetButtonBorders();
        beautify();
    };
    state.consoleBox.appendChild(buildButt);

    // building mode control buttons

    const floorBox = document.createElement('p');
    floorBox.innerHTML = `Active floor: ${state.floor}`;
    floorBox.className = 'build';
    floorBox.style.color = '#333';
    floorBox.startGroup = false;
    // cycle buildings
    const cycleBuildingButt = document.createElement('div');
    cycleBuildingButt.innerHTML = 'Cycle building';
    cycleBuildingButt.className = 'build';
    cycleBuildingButt.startGroup = false;
    cycleBuildingButt.onclick = () => {
        state.stateChange = true;
        state.buildingChange = true;
        const currentBuilding = state.activeBuilding;
        let buildingIndex = Object.keys(buildings).indexOf(currentBuilding);
        buildingIndex = buildingIndex < Object.keys(buildings).length - 1 ? buildingIndex + 1 : 0;
        state.activeBuilding = Object.keys(buildings)[buildingIndex];
        // reset zoom proportional to building size
        state.cameraInfo.position[2] = 1.5 * buildings[state.activeBuilding].length;

        resetBuildingState();
        resetButtonBorders();
        beautify();
        floorBox.innerHTML = `Active floor: ${state.floor}`;
    };
    state.consoleBox.appendChild(cycleBuildingButt);
    // button for toggling particle rendering on off
    const toggleBuildPartButt = document.createElement('div');
    toggleBuildPartButt.innerHTML = 'Toggle particles';
    toggleBuildPartButt.startGroup = true;
    toggleBuildPartButt.className = 'build';
    toggleBuildPartButt.addEventListener('mousedown', function clickIt() {
        state.stateChange = true;
        state.renderBuildingParticles = !state.renderBuildingParticles;
        state.wallTransparency = false;
        state.isolateBuildingHotspots = false;
        if (state.renderBuildingParticles) {
            state.pCountBox.innerHTML = `Particle count: ${state.buildingParticleCount}`;
        }
        this.style.border = !state.renderBuildingParticles ? '#222 1px solid' : '#0d933e 2px solid';
    });
    state.consoleBox.appendChild(toggleBuildPartButt);
    // wall transparency button
    const wallTranButt = document.createElement('div');
    wallTranButt.innerHTML = 'Toggle wall transparency';
    wallTranButt.startGroup = false;
    wallTranButt.className = 'build';
    wallTranButt.addEventListener('mousedown', function clickIt() {
        if (state.renderBuildingParticles) {
            state.stateChange = true;
            state.wallTransparency = !state.wallTransparency;
            this.style.border = !state.wallTransparency ? '#222 1px solid' : '#0d933e 2px solid';
        }
    });
    state.consoleBox.appendChild(wallTranButt);
    // button for toggling hotspot isolation
    const buildHotIsoButt = document.createElement('div');
    buildHotIsoButt.innerHTML = 'Toggle hotspot isolation';
    buildHotIsoButt.startGroup = true;
    buildHotIsoButt.className = 'build';
    buildHotIsoButt.addEventListener('mousedown', function clickIt() {
        if (state.renderBuildingParticles) {
            state.stateChange = true;
            state.isolateBuildingHotspots = !state.isolateBuildingHotspots;
            this.style.border = !state.isolateBuildingHotspots ? '#222 1px solid' : '#0d933e 2px solid';
        }
    });
    state.consoleBox.appendChild(buildHotIsoButt);
    // button for increasing the building particles hotspot isolation threshold
    const buildIsoThresholdUpButt = document.createElement('div');
    buildIsoThresholdUpButt.innerHTML = 'Increase hotspot threshold';
    buildIsoThresholdUpButt.startGroup = false;
    buildIsoThresholdUpButt.className = 'build';
    buildIsoThresholdUpButt.onclick = () => {
        if (state.renderBuildingParticles && state.isolateBuildingHotspots) {
            state.stateChange = true;
            state.buildingHotspotThreshold += state.buildingHotspotThreshold < 1.0 ? 0.05 : 0.0;
        }
    };
    state.consoleBox.appendChild(buildIsoThresholdUpButt);
    // button for decreasing the building particles hotspot isolation threshold
    const buildIsoThresholdDownButt = document.createElement('div');
    buildIsoThresholdDownButt.innerHTML = 'Decrease hotspot threshold';
    buildIsoThresholdUpButt.startGroup = false;
    buildIsoThresholdDownButt.className = 'build';
    buildIsoThresholdDownButt.onclick = () => {
        if (state.renderBuildingParticles && state.isolateBuildingHotspots) {
            state.stateChange = true;
            state.buildingHotspotThreshold -= state.buildingHotspotThreshold > 0.01 ? 0.05 : 0.0;
        }
    };
    state.consoleBox.appendChild(buildIsoThresholdDownButt);
    // button for toggling floor isolation on off
    const toggleFloorIsoButt = document.createElement('div');
    toggleFloorIsoButt.innerHTML = 'Toggle floor isolation';
    toggleFloorIsoButt.startGroup = true;
    toggleFloorIsoButt.className = 'build';
    toggleFloorIsoButt.addEventListener('mousedown', function clickIt() {
        state.stateChange = true;
        state.isolateFloor = !state.isolateFloor;
        // state.floor = state.floor > buildings[state.activeBuilding].length
        //    ? buildings[state.activeBuilding].length : state.floor;
        this.style.border = !state.isolateFloor ? '#222 1px solid' : '#0d933e 2px solid';
    });
    state.consoleBox.appendChild(toggleFloorIsoButt);
    // peel floor
    const peelFloorButt = document.createElement('div');
    peelFloorButt.innerHTML = 'Cycle floors';
    peelFloorButt.startGroup = false;
    peelFloorButt.className = 'build';
    peelFloorButt.onclick = () => {
        state.stateChange = true;
        const maxFloor = buildings[state.activeBuilding].length;
        state.floor = state.floor > 1 ? state.floor - 1 : maxFloor;
        state.cycleFloor = true;
        floorBox.innerHTML = `Active floor: ${state.floor}`;
    };
    state.consoleBox.appendChild(peelFloorButt);

    // button to toggle texture
    const toggleTextureButt = document.createElement('div');
    toggleTextureButt.innerHTML = 'Toggle building texture';
    toggleTextureButt.className = 'build';
    toggleTextureButt.startGroup = true;
    toggleTextureButt.onclick = () => {
        state.stateChange = true;
        state.useBuildingTexture = !state.useBuildingTexture;
    };
    state.consoleBox.appendChild(toggleTextureButt);

    state.consoleBox.appendChild(floorBox);

    // heatmap mode button
    const heatmapButt = document.createElement('div');
    heatmapButt.innerHTML = 'Heatmap mode';
    heatmapButt.startGroup = false;
    heatmapButt.onclick = () => {
        state.renderMode = Modes.HEATMAP;
        state.renderTank = true;
        state.changeTank = state.useConical;
        state.stateChange = true;
        state.reset = true;
        beautify();
    };
    state.consoleBox.appendChild(heatmapButt);

    // camera mode button
    const camButt = document.createElement('div');
    camButt.innerHTML = 'Camera mode';
    camButt.startGroup = false;
    camButt.onclick = () => {
        state.renderMode = Modes.CAMERA;
        state.renderTank = true;
        state.changeTank = state.useConical;
        state.stateChange = true;
        state.reset = true;
        beautify();
    };
    state.consoleBox.appendChild(camButt);

    // particle mode button
    const partButt = document.createElement('div');
    partButt.innerHTML = 'Particle mode';
    partButt.startGroup = false;
    state.consoleBox.appendChild(partButt);
    partButt.onclick = () => {
        state.renderMode = Modes.PARTICLES;
        state.renderTank = true;
        state.stateChange = true;
        state.reset = true;
        state.pCountBox.innerHTML = `Particle count: ${state.particleCount}`;
        beautify();
    };

    // toggle the use of sonar map
    const sonarButt = document.createElement('div');
    sonarButt.innerHTML = 'Toggle sonar map';
    sonarButt.startGroup = false;
    sonarButt.style.display = 'none';
    sonarButt.className = 'part';
    sonarButt.addEventListener('mousedown', function clickIt() {
        if (!state.exposeHotspots) {
            state.useSonarMap = !state.useSonarMap;
            state.stateChange = true;
            this.style.border = !state.useSonarMap ? '#222 1px solid' : '#0d933e 2px solid';
        }
    });
    state.consoleBox.appendChild(sonarButt);

    // heatspot isolation toogle
    const heatButt = document.createElement('div');
    heatButt.innerHTML = 'Toggle hotspot isolation';
    heatButt.startGroup = true;
    heatButt.style.display = 'none';
    heatButt.className = 'part';
    heatButt.addEventListener('mousedown', function clickIt() {
        if (state.renderMode === Modes.PARTICLES && !state.useSonarMap) {
            state.exposeHotspots = !state.exposeHotspots;
            state.stateChange = true;
            this.style.border = !state.exposeHotspots ? '#222 1px solid' : '#0d933e 2px solid';
        }
    });
    state.consoleBox.appendChild(heatButt);

    // button to increase threshold for hotspot isolation distance
    const hotUpButt = document.createElement('div');
    hotUpButt.innerHTML = 'Increase hotspot threshold';
    hotUpButt.startGroup = false;
    hotUpButt.style.display = 'none';
    hotUpButt.className = 'part';
    hotUpButt.onclick = () => {
        if (state.renderMode === Modes.PARTICLES && state.exposeHotspots) {
            state.hotspotThreshold += 0.01;
            state.stateChange = true;
        }
    };
    state.consoleBox.appendChild(hotUpButt);

    // button to decrease threshold for hotspot isolation distance
    const hotDownButt = document.createElement('div');
    hotDownButt.innerHTML = 'Decrease hotspot threshold';
    hotDownButt.startGroup = false;
    hotDownButt.style.display = 'none';
    hotDownButt.className = 'part';
    hotDownButt.onclick = () => {
        if (state.renderMode === Modes.PARTICLES && state.exposeHotspots) {
            state.hotspotThreshold -= 0.01;
            state.stateChange = true;
        }
    };
    state.consoleBox.appendChild(hotDownButt);

    // button to peel layer
    const peelLayerButt = document.createElement('div');
    peelLayerButt.innerHTML = 'Peel particle layer';
    peelLayerButt.startGroup = true;
    peelLayerButt.style.display = 'none';
    peelLayerButt.className = 'part';
    peelLayerButt.onclick = () => {
        if (state.renderMode === Modes.PARTICLES) {
            state.stateChange = true;
            if (state.depth[0] >= state.depth[1]) {
                state.depth[0] -= mSettings.particleRadius * 2;
            }
        }
    };
    state.consoleBox.appendChild(peelLayerButt);

    // button to add layer
    const addLayerButt = document.createElement('div');
    addLayerButt.innerHTML = 'Add particle layer';
    addLayerButt.startGroup = false;
    addLayerButt.style.display = 'none';
    addLayerButt.className = 'part';
    addLayerButt.onclick = () => {
        if (state.renderMode === Modes.PARTICLES) {
            state.stateChange = true;
            if (state.depth[0] < 0.0) {
                state.depth[0] += mSettings.particleRadius * 2;
            }
        }
    };
    state.consoleBox.appendChild(addLayerButt);

    // button to increase particle scale
    const decPartButt = document.createElement('div');
    decPartButt.innerHTML = 'Decrease particle count';
    decPartButt.startGroup = true;
    decPartButt.style.display = 'none';
    decPartButt.className = 'part';
    decPartButt.onclick = () => {
        if (state.renderMode === Modes.PARTICLES) {
            state.stateChange = true;
            if (mSettings.particleScale < 3.0) {
                mSettings.particleScale += 0.1;
                state.hotSpots = [];
                [state.assets.particles.nodes, state.assets.particles.sonarColors] = getParticles();
                state.changedParticles = true;
            }
        }
    };
    state.consoleBox.appendChild(decPartButt);

    // button to decrease particle scale
    const incPartButt = document.createElement('div');
    incPartButt.innerHTML = 'Increase particle count';
    incPartButt.startGroup = false;
    incPartButt.style.display = 'none';
    incPartButt.className = 'part';
    incPartButt.onclick = () => {
        if (state.renderMode === Modes.PARTICLES) {
            state.stateChange = true;
            if (mSettings.particleScale >= 0.6) {
                mSettings.particleScale -= 0.1;
                state.hotSpots = [];
                [state.assets.particles.nodes, state.assets.particles.sonarColors] = getParticles();
                state.changedParticles = true;
            }
        }
    };
    state.consoleBox.appendChild(incPartButt);

    // cycle tank button
    const cycleTankButt = document.createElement('div');
    cycleTankButt.innerHTML = 'Cycle net type';
    cycleTankButt.startGroup = true;
    cycleTankButt.className = 'part';
    cycleTankButt.onclick = () => {
        if (state.renderMode === Modes.PARTICLES) {
            state.stateChange = true;
            state.changeTank = true;
        }
    };
    state.consoleBox.appendChild(cycleTankButt);

    // increase fps button
    const incFpsButt = document.createElement('div');
    incFpsButt.innerHTML = 'Increase framerate';
    incFpsButt.startGroup = true;
    incFpsButt.onclick = () => {
        state.activeFps = state.activeFps < state.fps.length - 1 ? state.activeFps + 1 : 0;
        state.fpsBox.innerHTML = `framerate (fps): ${state.fpsStr[state.activeFps]}`;
    };
    state.consoleBox.appendChild(incFpsButt);

    const decFpsButt = document.createElement('div');
    decFpsButt.innerHTML = 'Decrease framerate';
    decFpsButt.startGroup = false;
    decFpsButt.onclick = () => {
        state.activeFps = state.activeFps > 0 ? state.activeFps - 1 : 0;
        state.fpsBox.innerHTML = `framerate (fps): ${state.fpsStr[state.activeFps]}`;
    };
    state.consoleBox.appendChild(decFpsButt);

    // reset button
    const resetButt = document.createElement('div');
    resetButt.innerHTML = 'Reset';
    resetButt.startGroup = true;
    resetButt.onclick = () => {
        state.reset = true;
        state.exposeHotspots = false;
        state.renderTank = true;
        state.hotspotThreshold = 0.2;
        state.depth[0] = 0.0;
        state.farmCamPos = [
            0.0,
            -0.055,
            0.0,
        ];
        state.farmCamRot = [
            0.0,
            0.0,
            0.0,
        ];
        state.stateChange = true;
    };
    state.consoleBox.appendChild(resetButt);

    // button to toggle rendering the tank
    const tankButt = document.createElement('div');
    tankButt.innerHTML = 'Toggle tank';
    tankButt.startGroup = false;
    tankButt.addEventListener('mousedown', function clickIt() {
        if (state.renderMode === Modes.PARTICLES
            || state.renderMode === Modes.CAMERA
            || state.renderMode === Modes.HEATMAP) {
            state.renderTank = !state.renderTank;
            state.stateChange = true;
            this.style.border = state.renderTank ? '#222 1px solid' : '#0d933e 2px solid';
        }
    });
    state.consoleBox.appendChild(tankButt);

    const pCountBox = document.createElement('p');
    pCountBox.innerHTML = `Particle count: ${state.particleCount}`;
    pCountBox.style.color = '#333';
    pCountBox.startGroup = true;
    state.pCountBox = pCountBox;
    state.consoleBox.appendChild(pCountBox);

    const fpsBox = document.createElement('p');
    fpsBox.innerHTML = `Framerate (fps): ${state.fps[state.activeFps]}`;
    fpsBox.startGroup = false;
    fpsBox.style.color = '#333';
    state.fpsBox = fpsBox;
    state.consoleBox.appendChild(fpsBox);

    // beautify the console box
    const beautify = () => {
        state.consoleBox.childNodes.forEach((child) => {
            child.style.margin = '5px 30px 0 0';
            if (child.className === 'part') {
                child.style.marginLeft = '10px';
                child.style.display = state.renderMode === Modes.PARTICLES ? 'block' : 'none';
                child.style.backgroundImage = 'linear-gradient(#444, #333)';
                child.style.fontFamily = 'Sans';
                child.style.border = '1px solid #333';
                child.style.cursor = 'pointer';
                child.onmouseover = () => {
                    child.style.backgroundImage = 'linear-gradient(#333, #444)';
                };
                child.style.color = '#ddd';
                child.onmouseout = () => {
                    child.style.backgroundImage = 'linear-gradient(#444, #333)';
                };
            }
            if (child.className === 'build') {
                if (child.nodeName === 'DIV') {
                    child.style.marginLeft = '10px';
                    child.style.backgroundImage = 'linear-gradient(#444, #333)';
                    child.style.fontFamily = 'Sans';
                    child.style.border = '1px solid #333';
                    child.style.cursor = 'pointer';
                    child.onmouseover = () => {
                        child.style.backgroundImage = 'linear-gradient(#333, #444)';
                    };
                    child.style.color = '#ddd';
                    child.onmouseout = () => {
                        child.style.backgroundImage = 'linear-gradient(#444, #333)';
                    };
                }
                child.style.display = state.renderMode === Modes.ROOMS ? 'block' : 'none';
            }
            if (child.tagName === 'DIV'
                && child.className !== 'part' && child.className !== 'build') {
                child.style.color = '#222';
                child.style.backgroundImage = 'linear-gradient(#999, #777)';
                child.style.fontFamily = 'Sans';
                child.style.border = '1px solid #444';
                child.onmouseover = () => {
                    child.style.backgroundImage = 'linear-gradient(#777, #999)';
                };
                child.onmouseout = () => {
                    child.style.backgroundImage = 'linear-gradient(#999, #777)';
                };
                child.style.cursor = 'pointer';
            }
            if (child.startGroup) {
                child.style.marginTop = '20px';
            }
            child.style.textAlign = 'center';
            child.style.padding = '5px';
            child.style.position = 'relative';
            child.style.borderRadius = '4px';
        });
    };

    const resetButtonBorders = () => {
        state.consoleBox.childNodes.forEach((child) => {
            if (child.nodeName === 'div') {
                child.style.border = '1px solid #333';
            }
        });
    };

    beautify();

    // create canvas element
    const canvas = Canvas();
    canvas.style.backgroundColor = '#ddd';

    // zoom events

    window.onwheel = (e) => {
        state.zoom = true;
        const zoomDirection = Math.sign(e.deltaY);
        state.zoomLvl = -zoomDirection;
    };

    canvas.onmousedown = (e) => {
        if (e.button === 1) {
            state.isMiddle = true;
        }
        state.isDragging = true;
        state.mouse.startX = e.clientX;
        state.mouse.startY = e.clientY; state.mouse.x = e.clientX; state.mouse.y = e.clientY;
    };

    canvas.onmousemove = (e) => {
        if (state.isDragging) {
            const deltaX = Math.abs(e.clientX - state.mouse.x);
            const deltaY = Math.abs(e.clientY - state.mouse.y);
            if (deltaX > 0.01 || deltaY > 0.01) {
                state.isMoving = true;
            }
            state.mouse.startX = state.mouse.x;
            state.mouse.startY = state.mouse.y;
            state.mouse.x = e.clientX;
            state.mouse.y = e.clientY;
        }
    };

    window.onmouseup = () => {
        state.isDragging = false;
        state.isMiddle = false;
        state.mouse.x = 0;
        state.mouse.y = 0;
        state.mouse.startX = 0;
        state.mouse.startY = 0;
        state.isMoving = false;
    };

    bod.appendChild(canvas);
    const gl = canvas.getContext('webgl2');

    return initScene(gl);
};

/**
 * helper function for creating control buttons for the farm camera
 *
 * @returns {HTMLDivElement} element containing camera controls
 */
const createCameraControls = () => {
    // camera controls
    const cameraControls = document.createElement('div');
    // buttons
    const upButt = document.createElement('div');
    const forwardButt = document.createElement('div');
    const downButt = document.createElement('div');
    const backwardButt = document.createElement('div');
    const thetaUpButt = document.createElement('div');
    const thetaDownButt = document.createElement('div');
    const phiUpButt = document.createElement('div');
    const phiDownButt = document.createElement('div');
    const title = document.createElement('div');

    title.innerHTML = 'Camera controls';

    thetaUpButt.innerHTML = '&#8614';
    thetaDownButt.innerHTML = '&#8612';
    phiUpButt.innerHTML = '&#8613';
    phiDownButt.innerHTML = '&#8615';

    upButt.innerHTML = '&#8613';
    forwardButt.innerHTML = '&#8614';
    downButt.innerHTML = '&#8615';
    backwardButt.innerHTML = '&#8612';

    upButt.innerHTML = '&#8613';
    forwardButt.innerHTML = '&#8614';
    downButt.innerHTML = '&#8615';
    backwardButt.innerHTML = '&#8612';

    upButt.id = 'up';
    forwardButt.id = 'forward';
    downButt.id = 'down';
    backwardButt.id = 'backward';
    thetaUpButt.id = 'theta-up';
    thetaDownButt.id = 'theta-down';
    phiUpButt.id = 'phi-up';
    phiDownButt.id = 'phi-down';
    title.id = 'title';

    const rotationControls = document.createElement('div');
    rotationControls.id = 'rotation';
    const positionControls = document.createElement('div');
    positionControls.id = 'position';

    // add title
    cameraControls.appendChild(title);
    // add rotation controls
    rotationControls.appendChild(thetaUpButt);
    rotationControls.appendChild(thetaDownButt);
    rotationControls.appendChild(phiUpButt);
    rotationControls.appendChild(phiDownButt);
    // add movement controls
    positionControls.appendChild(upButt);
    positionControls.appendChild(backwardButt);
    positionControls.appendChild(downButt);
    positionControls.appendChild(forwardButt);

    cameraControls.appendChild(rotationControls);

    cameraControls.appendChild(positionControls);

    cameraControls.childNodes.forEach((childNode) => {
        childNode.style.position = 'relative';
        childNode.style.marginLeft = '10px';
        childNode.style.left = 0;
        if (childNode.id === 'title') {
            childNode.style.top = 0;
        } else if (childNode.id === 'rotation') {
            childNode.style.marginTop = '0px';
        } else {
            childNode.style.marginTop = '80px';
        }
        if (childNode.id !== 'title') {
            childNode.childNodes.forEach((child) => {
                child.style.position = 'absolute';
                child.style.backgroundColor = '#333';
                child.style.color = '#ddd';
                child.style.border = '1px solid #eee';
                child.style.borderRadius = '4px';
                child.style.textAlign = 'center';
                child.style.width = '24px';
                child.style.height = '24px';
                child.style.fontSize = '1em';
                child.style.backgroundImage = 'linear-gradient(#555, #444)';
                child.onmouseover = () => {
                    child.style.backgroundImage = 'linear-gradient(#444, #555)';
                };
                child.onmouseout = () => {
                    child.style.backgroundImage = 'linear-gradient(#555, #444)';
                };
                child.style.cursor = 'pointer';
                switch (child.id) {
                case 'up':
                    child.style.top = '25px';
                    child.style.left = '25px';
                    child.onclick = () => {
                        const polar = cartesianToPolar(state.farmCamPos);
                        if (polar[2] <= -0.08) {
                            state.farmCamPos[1] += 0.1;
                            state.stateChange = true;
                        }
                    };
                    break;
                case 'backward':
                    child.style.top = '49px';
                    child.style.left = '0px';
                    child.onclick = () => {
                        const polar = cartesianToPolar(state.farmCamPos);
                        if (polar[0] <= Math.PI / 2 || polar[0] > 3 * (Math.PI / 2)) {
                            state.farmCamPos[0] -= 0.1;
                            state.stateChange = true;
                        } else if (polar[1] <= mSettings.maxRho - 0.1) {
                            state.farmCamPos[0] -= 0.1;
                            state.stateChange = true;
                        }
                    };
                    break;
                case 'forward':
                    child.style.top = '49px';
                    child.style.left = '48px';
                    child.onclick = () => {
                        const polar = cartesianToPolar(state.farmCamPos);
                        if ((polar[0] > Math.PI / 2 && polar[0] <= 3 * (Math.PI / 2))) {
                            state.farmCamPos[0] += 0.1;
                            state.stateChange = true;
                        } else if (polar[1] <= mSettings.maxRho - 0.1) {
                            state.farmCamPos[0] += 0.1;
                            state.stateChange = true;
                        }
                    };
                    break;
                case 'down':
                    child.style.top = '73px';
                    child.style.left = '25px';
                    child.onclick = () => {
                        const polar = cartesianToPolar(state.farmCamPos);
                        if (polar[2] >= -0.5382) {
                            state.farmCamPos[1] -= 0.1;
                            state.stateChange = true;
                        }
                    };
                    break;
                case 'theta-up':
                    child.style.top = '49px';
                    child.style.left = '48px';
                    child.onclick = () => {
                        state.stateChange = true;
                        state.farmCamRot[1] += Math.PI / 10;
                    };
                    break;
                case 'theta-down':
                    child.style.top = '49px';
                    child.style.left = '0px';
                    child.onclick = () => {
                        state.stateChange = true;
                        state.farmCamRot[1] -= Math.PI / 10;
                    };
                    break;
                case 'phi-up':
                    child.style.top = '25px';
                    child.style.left = '25px';
                    child.onclick = () => {
                        if (state.farmCamRot[2] < Math.PI / 2 - Math.PI / 10) {
                            state.stateChange = true;
                            state.farmCamRot[2] += Math.PI / 10;
                        }
                    };
                    break;
                default:
                    child.style.top = '73px';
                    child.style.left = '25px';
                    child.onclick = () => {
                        if (state.farmCamRot[2] > -Math.PI / 2 + Math.PI / 10) {
                            state.stateChange = true;
                            state.farmCamRot[2] -= Math.PI / 10;
                        }
                    };
                    break;
                }
            });
        }
    });

    cameraControls.style.position = 'absolute';
    cameraControls.style.right = `${Dimension.WIN_WIDTH * 0.15 - 210}px`;
    cameraControls.style.top = `${Dimension.WIN_HEIGHT * 0.15}px`;
    cameraControls.style.width = '200px';
    cameraControls.style.display = 'none';

    return cameraControls;
};

/**
 * initializes the scene
 *
 * creates and links the necessary shader programs
 *
 * @param {ctx} gl webgl context
 *
 * @returns {Array} webgl context and compiled shader program information
 */
const initScene = (gl) => {
    // enable/ clear webgl state
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // enable blending (transparency) and set how it is handled
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    const shaders = shaderPrograms(
        gl,
        {
            att: [
                'position',
                'normal',
                'vertexColor',
            ],
            uni: [
                'modMat',
                'viewMat',
                'projMat',
                'tankCamDir',
                'tankCamLoc',
                'camRot',
                'isTank',
                'isCamera',
            ],
        },
        {
            att: [
                'position',
                'normal',
                'offset',
                'sonarColor',
            ],
            uni: [
                'viewMat',
                'projMat',
                'camRot',
                'particleScale',
                'layerDepth',
                'hotspots',
                'hotspotThreshold',
                'isolate',
                'sonar',
            ],
        },
        {
            att: [
                'position',
                'normal',
                'uvs',
                'offset',
                'rotation',
                'scale',
            ],
            uni: [
                'projMat',
                'viewMat',
                'camRot',
                'floorLevel',
                'isolateFloor',
                'wallTransparency',
                'samplers',
                'useTexture',
            ],
        },
        {
            att: [
                'position',
                'normal',
                'offset',
            ],
            uni: [
                'projMat',
                'viewMat',
                'camRot',
                'particleScale',
                'activeFloor',
                'isolateFloor',
                'hotspots',
                'maxDistance',
                'isolateHotspots',
                'hotspotThreshold',
            ],
        },
    );
    // call code to import models into system
    createAssets(gl, shaders);

    return [gl, shaders];
};

export default initWindow;
