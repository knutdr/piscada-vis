/**
 * helper functions
 */
import { mSettings } from './state';

/**
 * helper function to convert from polar to cartesian coordinates
 *
 * @param {Array} position position in polar coordinates [theta, rho, z]
 *
 * @returns {vec3} position in cartesian coordinates [x, y, z]
 */
export const polarToCartesian = (
    position,
) => [position[1] * Math.cos(position[0]), position[2], position[1] * Math.sin(position[0])];

export const cartesianToPolar = (position) => {
    const rho = vectorLength(position);
    const theta = Math.acos(position[0] / rho);
    const depth = position[1];
    return [
        theta,
        rho,
        depth,
    ];
};

/**
 * returns a color based on a heatmap
 *
 * @param {Number} min minimum value of numeric range
 * @param {Number} max maximum value of numeric range
 * @param {Number} value value to get color from
 *
 * @returns {Array} 3 long array with r/g/b values in range [0, 1]
 */
export const heatMapCol = (min, max, value) => {
    const ratio = 2 * ((value - min) / (max - min));
    const b = Math.trunc(Math.max(150, 255 * (ratio - 1)));
    const g = Math.trunc(Math.max(100, 255 * (1 - ratio)));
    const r = 255 - g - b;
    return [r / 255, g / 255, b / 255];
};

/**
 * calculates the length of a vector in n dimensions
 *
 * @param {Array} vector vector in n dimensions
 *
 * @returns {Number} the length of the vector
 */
export const vectorLength = (vector) => {
    // throw an error if it is not a vector
    if (vector.constructor !== Array
        || vector.some((element) => Number.isNaN(element))) {
        throw new Error('Parameter has to be an array filled with numbers');
    }
    let arg = 0.0;
    vector.forEach((number) => {
        arg += number ** 2;
    });
    return Math.sqrt(arg);
};

/**
 * calculates the cartesian distance in n-dimensional space
 *
 * @param {Array} from starting vector
 * @param {Array} to ending vector
 *
 * @returns {Number} the distance between the two vectors
 */
export const cartDist = (
    from,
    to,
) => {
    const isNumber = (unit) => !Number.isNaN(unit);
    // only do calculation if no dimension mismatch
    if (from.length === to.length && from.every(isNumber) && to.every(isNumber)) {
        let par = 0.0;
        from.forEach((value, index) => {
            par += (value - to[index]) ** 2;
        });
        return Math.sqrt(par);
    }
};

/**
 * gets the color of a particle based on a sonar map
 *
 * @param {Array} particlePosition the position of the particle in polar coordinates
 * @param {Array} sonarData  array representation of sonar image
 *                            dimension: n x n x 4
 *
 * @returns {Array} color of the particle sampled from the sonar map
 */
export const particleColorFromSonar = (
    particlePosition,
    sonarData,
) => {
    const imageHeight = sonarData.samples.length;
    const imageWidth = sonarData.samples[0].length;
    const particleCartesian = polarToCartesian(particlePosition);
    const imageCoordinates = [
        particleCartesian[0] + mSettings.maxRho,
        particleCartesian[2] + mSettings.maxRho,
    ];
    const normalized = [
        imageCoordinates[0] / (2 * mSettings.maxRho),
        imageCoordinates[1] / (2 * mSettings.maxRho),
    ];
    const position = [
        Math.round(normalized[0] * imageWidth),
        Math.round(normalized[1] * imageHeight),
    ];
    const color = sonarData.samples[position[1]][position[0]];
    const finalColor = [
        color[0], color[1], color[2],
    ];
    return finalColor;
};
