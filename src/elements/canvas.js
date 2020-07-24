import { Dimension } from '../constants';
/**
 * creates the canvas to use as webgl window
 *
 * @returns {HTMLCanvasElement} the canvas element
 */
const Canvas = () => {
    const element = document.createElement('canvas');

    // set properties
    element.id = 'webgl-window';

    // set style
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.borderRadius = '2px';
    element.style.border = 'solid 1px #333';
    element.style.top = `${Dimension.WIN_HEIGHT * 0.1}px`;
    element.style.left = `${Dimension.WIN_WIDTH * 0.15}px`;
    element.style.width = `${Dimension.WIN_WIDTH * 0.7}px`;
    element.style.height = `${Dimension.WIN_HEIGHT * 0.7}px`;
    element.width = Dimension.WIN_WIDTH * 0.7;
    element.height = Dimension.WIN_HEIGHT * 0.7;

    return element;
};

export default Canvas;
