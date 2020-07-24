/**
 * hotspots file
 */
import { polarToCartesian, cartDist } from './utils';
import {
    mSettings,
    state,
    buildings,
    buildingParticleSettings,
    wallSettings,
} from './state';
import { getFloorSize, getFloorOffset } from './building-assets';

/**
 * returns a hotspot
 * @param {Number} theta angle from x line [0, 2pi]
 * @param {*} rho radius from origin to particle
 * @param {*} depth depth of hotspot
 *
 * @returns {Object} hotspot positional info
 */
export const Hotspot = (
    theta,
    rho,
    depth,
) => ({
    position: [
        theta,
        rho,
        depth,
    ],
});

/**
 * gets the hotspot as a single array of values
 *
 * @returns {Array} array of hotspots changed to cartesion coordinates
 */
export const getHotspots = () => {
    const hotspots = [];
    state.hotSpots.forEach((hotspot) => {
        hotspots.push(...polarToCartesian(hotspot.position));
    });
    return hotspots;
};

/**
 * helper function to generate hotspots in buildings
 * changes the state directly
 * NB: temporary function for demo purposes
 *     meant to be changed for real data
 *
 * @returns {undefined}
 */
export const generateBuildingHotspots = () => {
    const particleSize = buildingParticleSettings.originalScale * buildingParticleSettings.scale;
    Object.keys(buildings).forEach((building) => {
        const buildingOutline = buildings[building];
        const hotspots = [];
        for (let i = 0; i < 10; i++) {
            const floor = Math.floor(Math.random() * buildingOutline.length);
            const floorSize = getFloorSize(buildingOutline[floor]);
            const offset = [
                Math.random() * floorSize.width * particleSize
                    * (wallSettings.originalScale.x / particleSize),
                Math.random() * floorSize.height,
                -Math.random() * floorSize.depth * particleSize
                    * (wallSettings.originalScale.x / particleSize),
            ];
            hotspots.push({
                floor,
                offset,
            });
        }
        state.buildingHotspots[building] = hotspots;
    });
};

/**
 * gets the building hotspots from the state and translates to correct positioning
 *
 * @returns {Array} the hotspots in the buildings
 */
export const getBuildingHotspots = () => {
    const hotspots = [];
    const buildingOutline = buildings[state.activeBuilding];
    state.buildingHotspots[state.activeBuilding].forEach((hotspot) => {
        const hotspotFloor = hotspot.floor;
        const floorOutline = buildingOutline[hotspotFloor];
        const lastFloorOutline = buildingOutline[Math.max(hotspotFloor, 0)];
        const floorSize = getFloorSize(floorOutline);
        const lastFloorSize = getFloorSize(lastFloorOutline);
        const floorOffset = getFloorOffset(
            hotspotFloor,
            floorSize,
            lastFloorSize,
            floorOutline.xFloat,
            floorOutline.zFloat,
            floorOutline.xOffset,
            floorOutline.zOffset,
            buildingParticleSettings.originalScale * buildingParticleSettings.scale,
            wallSettings.originalScale.x,
        );
        hotspots.push(
            hotspot.offset[0] + floorOffset[0],
            hotspot.offset[1] + floorOffset[1],
            hotspot.offset[2] + floorOffset[2],
            hotspot.floor,
        );
    });
    return hotspots;
};

/**
 * calculates the distance from the particle to the
 * closest hotspot
 *
 * @param {Array} hotspots all of the hotspots in the water
 * @param {vec3} particlePosition the position of the particle
 *
 * @returns {Number} the distance between the two points
 */
export const getHotspotDistance = (
    hotspots,
    particlePosition,
) => {
    let closestDistance = mSettings.maxRho / mSettings.particleScale;
    hotspots.forEach((hotspot) => {
        const distance = cartDist(
            polarToCartesian(particlePosition),
            polarToCartesian(hotspot.position),
        );
        if (distance < closestDistance) {
            closestDistance = distance;
        }
    });
    return closestDistance;
};
