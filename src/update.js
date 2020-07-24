/**
 * code for updating the frame
 */
import mat4 from 'gl-mat4';
import { Modes } from './constants';
import { state } from './state';
import animateHotspots from './data';
import { getNetAsset, getParticles } from './assets';

/**
 * updates the frame
 *
 * all of code that changes the position of
 * objects are located here
 *
 * @param {ctx} gl webgl context
 * @param {Object} shaders shader programs
 *
 * @returns {undefined}
 */
const updateFrame = (gl, shaders) => {
    let changeX = 0.0;
    let changeY = 0.0;
    if (state.isDragging && state.isMoving) {
        changeX = ((state.mouse.x - state.mouse.startX) * Math.PI) / 100;
        changeY = ((state.mouse.y - state.mouse.startY) * Math.PI) / 100;
    } else {
        changeX = 0.0;
        changeY = 0.0;
    }

    // rotate viewing camera according to how much the mouse is moving
    if ((state.isDragging && state.isMoving) || state.reset) {
        // check if the middle button is pressed
        if (state.isMiddle) {
            // tell the renderer that something has changed
            state.stateChange = true;
            // calculate rotation based on how much the mouse has moved since last frame
            state.cameraInfo.rotation[2] = state.cameraInfo.rotation[2]
                < 2 * Math.PI ? state.cameraInfo.rotation[2] + changeX : changeX;
            state.cameraInfo.rotation[0] = state.cameraInfo.rotation[0]
                < 2 * Math.PI ? state.cameraInfo.rotation[0] + changeY : changeY;
        } else {
            /**
             * if the left mouse button is begin pressed
             * the rotation should be around y-axis
             *
             * NB! in gl the axis pointing up is the y axis
             */
            state.stateChange = true;
            // we use the mouse change in x direction to decide rotation
            state.cameraInfo.rotation[1] += changeX;
        }
        // if the reset button has been changed the rotation should be reset
        if (state.reset) {
            state.cameraInfo.rotation = [0.0, 0.0, 0.0];
            state.cameraInfo.position = [0.0, 0.0, 5.0];
        }
    }
    // when particle mode is enabled the hotspots should be animated
    if (state.renderMode === Modes.PARTICLES) {
        if (Math.random() > 0.2) {
            animateHotspots();
            state.stateChange = true;
        }
    }

    // translate the farm camera if camera mode is enabled
    if (state.renderMode === Modes.CAMERA) {
        if (state.stateChange) {
            state.assets.tankCam.position = state.farmCamPos;
            state.assets.tankCam.rotation = state.farmCamRot;
            [state.assets.camStaffVert.position[0]] = state.farmCamPos;
        }
    }

    // zoom
    if (state.zoom) {
        state.stateChange = true;
        const zoomVector = [];
        zoomVector[0] = -state.cameraInfo.position[0];
        zoomVector[1] = -state.cameraInfo.position[1];
        zoomVector[2] = -state.cameraInfo.position[2];
        state.cameraInfo.position[0] += zoomVector[0] * state.zoomLvl * 0.07;
        state.cameraInfo.position[1] += zoomVector[1] * state.zoomLvl * 0.07;
        state.cameraInfo.position[2] += zoomVector[2] * state.zoomLvl * 0.07;
    }

    if (state.stateChange) {
        // create the perspective matrix and send it as a uniform
        const fov = 45 * (Math.PI / 180);
        const asp = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 400.0;
        const projMat = mat4.create();
        mat4.perspective(
            projMat,
            fov,
            asp,
            zNear,
            zFar,
        );
        // create the view matrix and send it as uniform
        const viewMat = mat4.create();
        // the view matrix is based on the viewing camera position
        const camLoc = [];
        camLoc[0] = -state.cameraInfo.position[0];
        camLoc[1] = -state.cameraInfo.position[1];
        camLoc[2] = -state.cameraInfo.position[2];
        // we need to translate and rotate
        mat4.translate(viewMat, viewMat, camLoc);
        mat4.rotate(viewMat, viewMat, state.cameraInfo.rotation[0], [1, 0, 0]);
        mat4.rotate(viewMat, viewMat, state.cameraInfo.rotation[2], [0, 0, 1]);
        mat4.rotate(viewMat, viewMat, state.cameraInfo.rotation[1], [0, 1, 0]);

        // projection and view matrix uniforms depending on mode
        if (state.renderTank
            || state.renderMode === Modes.CAMERA || state.renderMode === Modes.HEATMAP) {
            gl.useProgram(shaders.default.program);
            gl.uniformMatrix4fv(
                shaders.default.uniformLoc.viewMat,
                false,
                viewMat,
            );
            gl.uniformMatrix4fv(
                shaders.default.uniformLoc.projMat,
                false,
                projMat,
            );
            gl.useProgram(null);
        }

        if (state.changeTank) {
            // if the tank has changed we need to regenerate particles
            const type = state.useConical ? 'default' : 'concial';
            state.assets.net = getNetAsset(gl, shaders, type);
            state.changeTank = false;
            state.useConical = !state.useConical;
            state.hotSpots = [];
            [state.assets.particles.nodes, state.assets.particles.sonarColors] = getParticles();
            state.changedParticles = true;
        }
        // send uniforms to particle program if we are in particle mode
        if (state.renderMode === Modes.PARTICLES) {
            gl.useProgram(shaders.particle.program);
            gl.uniformMatrix4fv(
                shaders.particle.uniformLoc.projMat,
                false,
                projMat,
            );
            gl.uniformMatrix4fv(
                shaders.particle.uniformLoc.viewMat,
                false,
                viewMat,
            );
            gl.useProgram(null);
        }

        if (state.renderMode === Modes.ROOMS) {
            // send matrix uniforms to wall rendering shader
            gl.useProgram(shaders.wall.program);
            gl.uniformMatrix4fv(
                shaders.wall.uniformLoc.projMat,
                false,
                projMat,
            );
            gl.uniformMatrix4fv(
                shaders.wall.uniformLoc.viewMat,
                false,
                viewMat,
            );
            if (state.renderBuildingParticles) {
                gl.useProgram(shaders.buildingParticle.program);
                gl.uniformMatrix4fv(
                    shaders.buildingParticle.uniformLoc.projMat,
                    false,
                    projMat,
                );
                gl.uniformMatrix4fv(
                    shaders.buildingParticle.uniformLoc.viewMat,
                    false,
                    viewMat,
                );
            }
        }

        // reset state to disable behavior
        state.zoom = false;
        state.zoomLvl = 0.0;
        state.reset = false;
        state.isMoving = false;

        /**
         * for heatmap/camera mode we have objects that
         * have change position in addition to the
         * camera rotation
         *
         * this means we need to update their transformation matrices
         * according to their state position/rotation
         */
        if (state.renderMode === Modes.CAMERA || state.renderMode === Modes.HEATMAP) {
            updateTransformations();
        }
    }
};

/**
 * updates the transformation matrix of the nodes
 * based on their position in the program
 *
 * NB!  the order of the transformation matters here.
 *      this is because matrix multiplication is not commutative.
 *
 * @returns {undefined}
 */
const updateTransformations = () => {
    // the heatMap
    if (state.renderMode === Modes.HEATMAP) {
        state.assets.heatMapLayers.forEach((node) => {
            const T = mat4.create();
            mat4.rotate(T, T, node.rotation[0], [1, 0, 0]);
            mat4.rotate(T, T, node.rotation[2], [0, 0, 1]);
            mat4.rotate(T, T, node.rotation[1], [0, 1, 0]);
            mat4.translate(T, T, node.position);
            mat4.scale(T, T, node.scale);
            node.currentTransformation = T;
        });
    }

    // the camera
    if (state.renderMode === Modes.CAMERA) {
        const T = mat4.create();
        mat4.translate(T, T, state.assets.tankCam.position);
        mat4.rotate(T, T, state.assets.tankCam.rotation[1], [0, 1, 0]);
        mat4.rotate(T, T, state.assets.tankCam.rotation[2], [0, 0, 1]);
        mat4.rotate(T, T, state.assets.tankCam.rotation[0], [1, 0, 0]);
        mat4.scale(T, T, state.assets.tankCam.scale);
        state.assets.tankCam.currentTransformation = T;

        const Tr = mat4.create();
        mat4.translate(Tr, Tr, state.assets.camStaffVert.position);
        mat4.rotate(Tr, Tr, state.assets.camStaffVert.rotation[1], [0, 1, 0]);
        mat4.rotate(Tr, Tr, state.assets.camStaffVert.rotation[2], [0, 0, 1]);
        mat4.rotate(Tr, Tr, state.assets.camStaffVert.rotation[0], [1, 0, 0]);
        mat4.scale(Tr, Tr, state.assets.camStaffVert.scale);
        state.assets.camStaffVert.currentTransformation = Tr;
    }
};

export default updateFrame;
