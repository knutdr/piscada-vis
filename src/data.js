import { state, mSettings } from './state';
/**
 * functionality for data handling
 */

/**
 * animates the hotspots randomly for demonstration purposes
 * changes the state directly
 * NB: just a temporary function for demo purposes
 *
 * @returns {undefined}
 */
const animateHotspots = () => {
    const deltaTheta = Math.PI / 30;
    const deltaRho = mSettings.maxRho / 100;
    const deltaDepth = mSettings.waterHeight / 100;
    state.hotSpots.forEach((hotspot, index) => {
        let theta;
        let rho;
        let depth;
        if (Math.random() > 0.5) {
            theta = hotspot.position[0] - deltaTheta;
        } else {
            theta = hotspot.position[0] + deltaTheta;
        }
        if (Math.random() > 0.5) {
            if (hotspot.position[1] > 0) {
                rho = hotspot.position[1] - deltaRho;
            }
        } else {
            rho = hotspot.position[1] + deltaRho;
        }
        if (Math.random() > 0.5) {
            depth = hotspot.position[2] + deltaDepth;
        } else {
            depth = hotspot.position[2] - deltaDepth;
        }

        state.hotSpots[index].position = [
            theta,
            rho,
            depth,
        ];
    });
};

export default animateHotspots;
