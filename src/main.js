/**
 * Main js file for the project
 *
 *
 */
import { renderFrame, renderBuilding } from './render';
import updateFrame from './update';
import initWindow from './init';
import { state } from './state';
import { Modes } from './constants';

/**
 * main entrypoint
 *
 * @returns {undefined}
 */
const main = () => {
    // creates the html dom elements and shader programs
    const [gl, shaders] = initWindow();

    run(gl, shaders);
};

/**
 * runs the program
 * @param {ctx} gl webgl context
 * @param {Array} programInfo info about the shader programs
 *
 * @returns {undefined}
 */
const run = (gl, programInfo) => {
    let then = 0;
    let leftOverElapsed = 0;
    state.fpsBox.innerHTML = `framerate (fps): ${state.fpsStr[state.activeFps]}`;
    const render = (now) => {
        // time management
        const nowSeconds = now * 0.001;
        // add the elapsed time since last animation frame
        const elapsed = nowSeconds - then + leftOverElapsed;
        then = nowSeconds;
        // render the frame depending on if enough time has elapsed
        if ((elapsed >= state.fps[state.activeFps])) {
            // update the position of things
            updateFrame(gl, programInfo);
            // do not render anything unless something has changed
            if (state.stateChange) {
                // clear color
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                // decide which render function to call depending on the mode
                if (state.renderMode === Modes.ROOMS) {
                    renderBuilding(gl, programInfo);
                } else {
                    renderFrame(gl, programInfo);
                }
                // we rendered something so we should start counting from 0
                leftOverElapsed = 0;
                // turn off the rendering until some change has been made again
                state.stateChange = false;
            }
        } else {
            /**
             * if there hasn't been enough time elapsed
             * we need to keep the elapsed time for the next time
             * we check
             */
            leftOverElapsed = elapsed;
        }
        // keep the rendering going
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
};

export default main;
