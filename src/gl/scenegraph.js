/**
 * Code belonging to the scenegraph
 */
import mat4 from 'gl-mat4';

export const GEOMETRY = 0;
export const TEXTURED = 1;
export const POINT_LIGHT = 2;

/**
 * holds info about a scenenode
 *
 * @param {vec3} position position of the node
 * @param {vec3} rotation rotation of the node
 * @param {Number} scale scale of the node
 * @param {vec3} refPoint reference point of the node
 * @param {Number} vaoId id of the data buffers for the node
 * @param {Number} vaoCount count of the vertices in the node
 * @param {String} nodeType type of the node
 * @param {vec3} objColor color of the object
 * @param {Number} alpha the opacity of the object
 *
 * @returns {Object} scene node information
 */
export const SceneNode = (
    position,
    rotation,
    scale,
    refPoint,
    vaoId,
    vaoCount,
    nodeType,
    objColor,
    alpha,
) => ({
    position,
    rotation,
    scale,
    refPoint,
    vaoId,
    vaoCount,
    nodeType,
    children: [],
    currentTransformation: mat4.create(),
    objColor: objColor.concat(alpha),
});

/**
 * adds a child node to a scene node
 *
 * @param {SceneNode} parent the node to add the child to
 * @param {SceneNode} child the child to add
 *
 * @returns {undefined}
 */
export const addChild = (parent, child) => {
    parent.children.push(child);
};
