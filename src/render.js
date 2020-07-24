/**
 * code for rendering the frame
 */
import { Modes } from './constants';
import {
    mSettings,
    buildings,
    state,
    buildingParticleSettings,
} from './state';
import {
    getHotspots,
    getBuildingHotspots,
} from './hotspot';
import {
    createRooms,
    generateParticles,
    getMaxDistance,
} from './building-assets';
import { createAttributes } from './gl/buffer';

/**
 * render function for particle / camera / heatmap mode
 *
 * @param {WebGL2RenderingContext} gl webgl context
 * @param {Object} shaders info about the shader programs
 *
 * @returns {undefined}
 */
export const renderFrame = (gl, shaders) => {
    if (state.renderMode === Modes.PARTICLES) {
        // render the particles using instancing
        gl.useProgram(shaders.particle.program);
        // send in necessary uniforms
        gl.uniform3fv(shaders.particle.uniformLoc.camRot, state.cameraInfo.rotation);
        gl.uniform1f(shaders.particle.uniformLoc.particleScale, mSettings.particleScale);
        gl.uniform3fv(shaders.particle.uniformLoc.hotspots, getHotspots());
        gl.uniform1f(shaders.particle.uniformLoc.hotspotThreshold, state.hotspotThreshold);
        gl.uniform1f(shaders.particle.uniformLoc.layerDepth, state.depth[0]);
        gl.uniform1i(shaders.particle.uniformLoc.isolate, state.exposeHotspots);
        gl.uniform1i(shaders.particle.uniformLoc.sonar, state.useSonarMap);

        // vertex array pointers for the vertices of the model
        createAttributes(
            gl,
            shaders.particle,
            state.assets.particles.vaoId.data,
            {
                position: {
                    size: 3,
                },
                normal: {
                    size: 3,
                },
            },
        );

        // fix the instances on the gpu
        gl.bindBuffer(gl.ARRAY_BUFFER, state.assets.particles.vaoId.offset);
        /**
         * if we have generated new particles we need to send the
         * position data to the buffer on the gpu again before drawing
         */
        if (state.changedParticles) {
            const data = [];
            state.assets.particles.nodes.forEach((particle) => {
                data.push(...particle.position);
            });
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        }
        // create vertex attribute pointer for offset of particles
        gl.enableVertexAttribArray(shaders.particle.attribLoc.offset);
        gl.vertexAttribPointer(
            shaders.particle.attribLoc.offset,
            3,
            gl.FLOAT,
            false,
            12,
            0,
        );
        gl.vertexAttribDivisor(shaders.particle.attribLoc.offset, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, state.assets.particles.vaoId.sonar);
        /**
         * if we have generated new particles we need to send the
         * new sonar colors to the gpu as well
         */
        if (state.changedParticles) {
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(state.assets.particles.sonarColors),
                gl.STATIC_DRAW,
            );
        }
        // make sure we disable this behavior
        state.changedParticles = false;
        // create vertex attribute pointer for the sonar colors
        gl.enableVertexAttribArray(shaders.particle.attribLoc.sonarColor);
        gl.vertexAttribPointer(
            shaders.particle.attribLoc.sonarColor,
            3,
            gl.FLOAT,
            false,
            12,
            0,
        );
        gl.vertexAttribDivisor(shaders.particle.attribLoc.sonarColor, 1);

        // draw the particles
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.assets.particles.vaoId.indices);
        gl.drawElementsInstanced(
            gl.TRIANGLES,
            state.assets.particles.vaoCount,
            gl.UNSIGNED_SHORT,
            0,
            state.assets.particles.nodes.length,
        );
    }

    /**
     * if the tank is enabled or we are in a mode
     * that needs the default shader program
     * we need to send the viewing camera rotation for lighting purposes
     *
     * we do this convoluted check so we
     * decrease the amount of gl calls because they are expensive
     * (every single webgl will be validated for security issues,
     *  which creates a lot of overhead)
     */
    if (state.renderTank
        || state.renderMode === Modes.CAMERA
        || state.renderMode === Modes.HEATMAP) {
        gl.useProgram(shaders.default.program);
        gl.uniform3fv(shaders.default.uniformLoc.camRot, state.cameraInfo.rotation);
    }

    // check if we are in camera mode
    if (state.renderMode === Modes.CAMERA) {
        // send the matrix for transforming the camera position
        gl.uniformMatrix4fv(
            shaders.default.uniformLoc.modMat,
            false,
            state.assets.tankCam.currentTransformation,
        );
        // send uniforms for drawing the camera and camera staffs
        gl.uniform1i(shaders.default.uniformLoc.isTank, 0);
        gl.uniform1i(shaders.default.uniformLoc.isCamera, 1);

        gl.uniform3fv(
            shaders.default.uniformLoc.tankCamLoc,
            state.farmCamPos,
        );

        gl.uniform3fv(
            shaders.default.uniformLoc.tankCamDir,
            state.farmCamRot,
        );

        // create vertex attrib point for camera
        // position
        createAttributes(
            gl,
            shaders.default,
            state.assets.tankCam.vaoId.data,
            {
                position: {
                    size: 3,
                },
                normal: {
                    size: 3,
                },
                vertexColor: {
                    size: 4,
                },
            },
        );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.assets.tankCam.vaoId.indices);

        // draw the camera
        let vertexCount = state.assets.tankCam.vaoCount;
        const type = gl.UNSIGNED_SHORT;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, 0);

        // uniforms for horisontal beam
        gl.uniformMatrix4fv(
            shaders.default.uniformLoc.modMat,
            false,
            state.assets.camStaffHor.currentTransformation,
        );
        gl.uniform1i(
            shaders.default.uniformLoc.isCamera,
            false,
            0,
        );

        // create vertex attrib point for horisontal beam
        // position
        createAttributes(
            gl,
            shaders.default,
            state.assets.camStaffHor.vaoId.data,
            {
                position: {
                    size: 3,
                },
                normal: {
                    size: 3,
                },
                vertexColor: {
                    size: 4,
                },
            },
        );
        // draw the horisontal beam
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.assets.camStaffHor.vaoId.indices);
        vertexCount = state.assets.camStaffHor.vaoCount;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, 0);

        // uniforms for verticalbeam
        gl.uniformMatrix4fv(
            shaders.default.uniformLoc.modMat,
            false,
            state.assets.camStaffVert.currentTransformation,
        );

        // create vertex attrib point for vertical beam
        // position
        createAttributes(
            gl,
            shaders.default,
            state.assets.camStaffVert.vaoId.data,
            {
                position: {
                    size: 3,
                },
                normal: {
                    size: 3,
                },
                vertexColor: {
                    size: 4,
                },
            },
        );
        // draw the horisontal beam
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.assets.camStaffVert.vaoId.indices);
        vertexCount = state.assets.camStaffVert.vaoCount;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, 0);
    }
    // check if we are in heat map mode
    if (state.renderMode === Modes.HEATMAP) {
        // send necessary uniforms
        gl.uniform3fv(shaders.default.uniformLoc.camRot, state.cameraInfo.rotation);
        // for these we have several layers that we need to draw
        for (let i = state.assets.heatMapLayers.length - 1; i >= 0; i--) {
            const node = state.assets.heatMapLayers[i];
            // take care of necessary uniforms
            gl.uniformMatrix4fv(
                shaders.default.uniformLoc.modMat,
                false,
                node.currentTransformation,
            );
            // create attrib pointers
            // vertices first
            createAttributes(
                gl,
                shaders.default,
                node.vaoId.data,
                {
                    position: {
                        size: 3,
                    },
                    normal: {
                        size: 3,
                    },
                    vertexColor: {
                        size: 4,
                    },
                },
            );
            // draw the heatmap layer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, node.vaoId.indices);
            const vertexCount = node.vaoCount;
            const type = gl.UNSIGNED_SHORT;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, 0);
        }
    }
    // check if the tank is enabled
    if (state.renderTank) {
        /**
         * if we are in camera mode we need to tell the
         * shader that we are drawing the tank so
         * that we can decide to cast the projection of the farm camera
         * on the farm construction
         */
        if (state.renderMode === Modes.CAMERA) {
            gl.uniform1i(shaders.default.uniformLoc.isTank, 1);
            gl.uniform1i(
                shaders.default.uniformLoc.isCamera,
                0,
            );
        } else {
            // disable this behavior for other modes
            gl.uniform1i(shaders.default.uniformLoc.isTank, 0);
        }
        // loop through the nodes of the tank
        for (let i = state.assets.nodes.length - 1; i >= 0; i--) {
            const node = state.assets.nodes[i];
            // send the necessary uniform values to the gpu
            gl.uniformMatrix4fv(
                shaders.default.uniformLoc.modMat,
                false,
                node.currentTransformation,
            );

            // create attrib pointers
            createAttributes(
                gl,
                shaders.default,
                node.vaoId.data,
                {
                    position: {
                        size: 3,
                    },
                    normal: {
                        size: 3,
                    },
                    vertexColor: {
                        size: 4,
                    },
                },
            );
            // draw the construction around the farm
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, node.vaoId.indices);
            const vertexCount = node.vaoCount;
            const type = gl.UNSIGNED_SHORT;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, 0);
        }
        // send the uniforms necessary for the net
        gl.uniformMatrix4fv(
            shaders.default.uniformLoc.modMat,
            false,
            state.assets.net.currentTransformation,
        );

        // create attribs
        createAttributes(
            gl,
            shaders.default,
            state.assets.net.vaoId.data,
            {
                position: {
                    size: 3,
                },
                normal: {
                    size: 3,
                },
                vertexColor: {
                    size: 4,
                },
            },
        );
        // draw the fish net
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.assets.net.vaoId.indices);
        gl.drawElements(gl.TRIANGLES, state.assets.net.vaoCount, gl.UNSIGNED_SHORT, 0);
    }
};

/**
 * render function for building mode
 *
 * NB!  since the walls and particles are both
 *      rendered using instances they use
 *      different shader programs
 *
 * @param {WebGL2RenderingContext} gl webgl rendering context
 * @param {Object} shaders shader program information
 *
 * @returns {undefined}
 */
export const renderBuilding = (
    gl,
    shaders,
) => {
    /**
     * since the walls can be transparent the particles need to be drawn first.
     *
     * this is because webgl needs to be able to see what is behind
     * the objects that should be transparent so the blending will be correct
     */
    renderBuildingParticles(gl, shaders.buildingParticle);

    // use the shader program for the walls
    gl.useProgram(shaders.wall.program);
    // activate and bind textures that are used
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.assets.walls.wallTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, state.assets.walls.floorTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, state.assets.walls.grassTexture);
    // send the texture samplers as uniforms to the fragment shader
    gl.uniform1iv(shaders.wall.uniformLoc.samplers, [0, 1, 2]);

    // send uniform telling the shader if the textures are enabled
    gl.uniform1i(shaders.wall.uniformLoc.useTexture, state.useBuildingTexture);
    // uniform for view camera rotation for lighting purposes
    gl.uniform3fv(
        shaders.wall.uniformLoc.camRot,
        state.cameraInfo.rotation,
    );
    // which floor we current have activated
    gl.uniform1i(
        shaders.wall.uniformLoc.floorLevel,
        state.floor,
    );
    // tell the shader if isolation of floors is activated
    gl.uniform1i(
        shaders.wall.uniformLoc.isolateFloor,
        state.isolateFloor,
    );
    // tell the shader if wall transparency is activated
    gl.uniform1i(
        shaders.wall.uniformLoc.wallTransparency,
        state.wallTransparency,
    );

    /**
     * if the building has been changed the data
     * needs to be refreshed in the buffer on the gpu
     * before drawing
     */
    gl.bindBuffer(gl.ARRAY_BUFFER, state.assets.walls.vaoId.instance);
    if (state.buildingChange) {
        // generate new data based on the active building
        [
            state.assets.walls.nodes,
            state.assets.walls.instanceData,
        ] = createRooms(buildings[state.activeBuilding]);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(state.assets.walls.instanceData),
            gl.STATIC_DRAW,
        );
    }

    // create vertex attrib pointers
    // standard
    createAttributes(
        gl,
        shaders.wall,
        state.assets.walls.vaoId.data,
        {
            position: {
                size: 3,
            },
            normal: {
                size: 3,
            },
            uvs: {
                size: 2,
            },
        },
    );
    // instance attribute pointers
    createAttributes(
        gl,
        shaders.wall,
        state.assets.walls.vaoId.instance,
        {
            offset: {
                size: 3,
            },
            rotation: {
                size: 3,
            },
            scale: {
                size: 3,
            },
        },
        1,
    );

    // draw the instances of the wall model
    gl.bindBuffer(
        gl.ELEMENT_ARRAY_BUFFER,
        state.assets.walls.vaoId.indices,
    );
    gl.drawElementsInstanced(
        gl.TRIANGLES,
        state.assets.walls.vaoCount,
        gl.UNSIGNED_SHORT,
        0,
        state.assets.walls.nodes.length,
    );

    state.buildingChange = false;
};

/**
 * renders the building particles
 *
 * NB!  since the walls and particles are both
 *      rendered using instances they use
 *      different shader programs
 *
 * @param {ctx} gl webgl context
 * @param {Object} shader info about the shader
 *
 * @returns {undefined}
 */
const renderBuildingParticles = (gl, shader) => {
    // use the correct program
    gl.useProgram(shader.program);

    /**
     * if the building has been changed the
     * particles need to be generated again and
     * the data needs to be refreshed in the
     * buffer on the gpu
     */
    if (state.buildingChange || state.cycleFloor) {
        gl.bindBuffer(gl.ARRAY_BUFFER, state.assets.buildingParticles.vaoId.instance);
        [
            state.assets.buildingParticles.nodes,
            state.assets.buildingParticles.data,
        ] = generateParticles(buildings[state.activeBuilding], state.floor - 1);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(state.assets.buildingParticles.data),
            gl.STATIC_DRAW,
        );
        state.cycleFloor = false;
    }

    // check if the building particles are enabled
    if (state.renderBuildingParticles) {
        // tell the shader how the viewing camera is rotated
        gl.uniform3fv(
            shader.uniformLoc.camRot,
            new Float32Array(state.cameraInfo.rotation),
        );
        // tell the shader how to scale the building particles
        gl.uniform1f(
            shader.uniformLoc.particleScale,
            buildingParticleSettings.scale,
        );
        /**
         * tell the shader the max distance between particles
         * this is so the shader can calculate the particle color map
         * based on distance from hotspots
         */
        gl.uniform1f(
            shader.uniformLoc.maxDistance,
            getMaxDistance(),
        );
        // get the hotspots position in the right format
        const hotspots = getBuildingHotspots();
        // send the hotspot position to the shader
        gl.uniform4fv(
            shader.uniformLoc.hotspots,
            new Float32Array(hotspots),
        );
        // tell the shader which floor is active
        gl.uniform1i(
            shader.uniformLoc.activeFloor,
            state.floor,
        );
        // tell the shader if floor isolation is enabled
        gl.uniform1i(
            shader.uniformLoc.isolateFloor,
            state.isolateFloor,
        );
        // tell the shader if hotspot isolation is enabled
        gl.uniform1i(
            shader.uniformLoc.isolateHotspots,
            state.isolateBuildingHotspots,
        );
        /**
         * tell the shader how big a radius to render
         * particles around hotspots if hotspot isolation is enabled
         */
        gl.uniform1f(
            shader.uniformLoc.hotspotThreshold,
            state.buildingHotspotThreshold,
        );

        // create attribs for model
        createAttributes(
            gl,
            shader,
            state.assets.buildingParticles.vaoId.data,
            {
                position: {
                    size: 3,
                },
                normal: {
                    size: 3,
                },
            },
        );
        // create attribs for instance data
        createAttributes(
            gl,
            shader,
            state.assets.buildingParticles.vaoId.instance,
            {
                offset: {
                    size: 3,
                },
            },
            1,
        );

        // bind indices buffer
        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            state.assets.buildingParticles.vaoId.indices,
        );
        // draw the particles
        gl.drawElementsInstanced(
            gl.TRIANGLES,
            state.assets.buildingParticles.vaoCount,
            gl.UNSIGNED_SHORT,
            0,
            state.assets.buildingParticles.nodes.length,
        );
    }
};
