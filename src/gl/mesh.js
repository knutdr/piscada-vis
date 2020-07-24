/**
 * Mesh file
 *
 */

/**
 * An object defined by vertices, normals, texture coordinates and indices
 *
 * @param {Array} vertices the vertices of the mesh
 * @param {Array} normals the normals of the mesh
 * @param {Array} uvs the uvs of the mesh
 * @param {Array} indices the indices of the mesh
 * @param {Array} colors the colors of the mesh
 *
 * @returns {Object} mesh data
 */
export const Mesh = (vertices, normals, uvs, indices, colors = []) => ({
    vertices,
    normals,
    colors,
    uvs,
    indices,
});

/**
 * Parses a textual representation of an object
 * file into arrays containing vertices, normals, uvs, colors, etc.
 *
 * @param {String} objData textual representation of the obj file
 *
 * @returns {Object} a mesh object
 */
export const parseObjFile = (objData) => {
    // temp storage
    const vertices = [];
    const normals = [];
    const uvs = [];

    // final destination for data
    const unpacked = {};
    unpacked.vertices = [];
    unpacked.normals = [];
    unpacked.uvs = [];
    unpacked.hashIndices = [];
    unpacked.indices = [];
    unpacked.index = 0;

    // get number of lines in .obj
    const lines = objData.split('\n');

    // regular expressions for parsing .obj
    const VERT_RE = /^v\s/;
    const NORMAL_RE = /^vn\s/;
    const UV_RE = /^vt\s/;
    const FACE_RE = /^f\s/;
    const WHITESPACE_RE = /\s+/;

    lines.forEach((line) => {
        // get line in form of elements
        line = line.trim();
        const elements = line.split(WHITESPACE_RE);
        // remove line label from elements
        elements.shift();

        if (VERT_RE.test(line)) {
            // line is a vertex
            vertices.push(...elements);
        } else if (NORMAL_RE.test(line)) {
            // line is a vertex normal
            normals.push(...elements);
        } else if (UV_RE.test(line)) {
            // line is a uv coor
            uvs.push(...elements);
        } else if (FACE_RE.test(line)) {
            /**
             * line defines a face
             */
            let quad = false;
            for (let j = 0, eleLen = elements.length; j < eleLen; j++) {
                if (j === 3 && !quad) {
                    // it is a quad
                    j = 2;
                    quad = true;
                }
                if (elements[j] in unpacked.hashIndices) {
                    // vertice already exist so we can use an index instead of repeating it
                    unpacked.indices.push(unpacked.hashIndices[elements[j]]);
                } else {
                    // we need to triangulate the quad
                    // get the information about the vertices (vertex/uv/normal)
                    const vertex = elements[j].split('/');
                    // vertex pos
                    unpacked.vertices.push(vertices[(vertex[0] - 1) * 3 + 0]);
                    unpacked.vertices.push(vertices[(vertex[0] - 1) * 3 + 1]);
                    unpacked.vertices.push(vertices[(vertex[0] - 1) * 3 + 2]);
                    // vertex uvs
                    unpacked.uvs.push(uvs[(vertex[1] - 1) * 2 + 0]);
                    unpacked.uvs.push(uvs[(vertex[1] - 1) * 2 + 1]);

                    // vertex norms
                    unpacked.normals.push(normals[(vertex[2] - 1) * 3 + 0]);
                    unpacked.normals.push(normals[(vertex[2] - 1) * 3 + 1]);
                    unpacked.normals.push(normals[(vertex[2] - 1) * 3 + 2]);

                    // add the new vertices to the hashindices
                    unpacked.hashIndices[elements[j]] = unpacked.index;
                    unpacked.indices.push(unpacked.index);
                    // increment index counter
                    unpacked.index += 1;
                }
                if (j === 3 && quad) {
                    // add v0/t0/n0 to the indices because this is a quad
                    unpacked.indices.push(unpacked.hashIndices[elements[0]]);
                }
            }
        }
    });
    return Mesh(unpacked.vertices, unpacked.normals, unpacked.uvs, unpacked.indices);
};

/**
 * parses an obj file and returns the given data in a packed array
 *
 * vertex offset 0
 * normal offset 12
 * uv offset 24
 * stride 32
 *
 * @param {string} objData string representation of obj file
 * @param {Array} color externally defined colors for the vertices
 * @param {boolean} keepUvs whether or not to keep uvs
 *
 * @returns {Object} object containing vertice data and indices
 */
export const parseObjFilePacked = (objData, color = [], keepUvs = false) => {
    // temp storage
    const vertices = [];
    const normals = [];
    const uvs = [];

    // final destination for data
    const unpacked = {};
    unpacked.data = [];
    unpacked.hashIndices = [];
    unpacked.indices = [];
    unpacked.index = 0;

    // get number of lines in .obj
    const lines = objData.split('\n');

    // regular expressions for parsing .obj
    const VERT_RE = /^v\s/;
    const NORMAL_RE = /^vn\s/;
    const UV_RE = /^vt\s/;
    const FACE_RE = /^f\s/;
    const WHITESPACE_RE = /\s+/;
    lines.forEach((line) => {
        // get line in form of elements
        line = line.trim();
        const elements = line.split(WHITESPACE_RE);
        // remove line label from elements
        elements.shift();

        if (VERT_RE.test(line)) {
            // line is a vertex
            vertices.push(...elements);
        } else if (NORMAL_RE.test(line)) {
            // line is a vertex normal
            normals.push(...elements);
        } else if (UV_RE.test(line)) {
            // line is a uv coor
            uvs.push(...elements);
        } else if (FACE_RE.test(line)) {
            /**
             * line defines a face
             */
            let quad = false;
            for (let j = 0, eleLen = elements.length; j < eleLen; j++) {
                if (j === 3 && !quad) {
                    // it is a quad
                    j = 2;
                    quad = true;
                }
                if (elements[j] in unpacked.hashIndices) {
                    // vertice already exist so we can use an index instead of repeating it
                    unpacked.indices.push(unpacked.hashIndices[elements[j]]);
                } else {
                    // we need to triangulate the quad
                    // get the information about the vertices (vertex/uv/normal)
                    const vertex = elements[j].split('/');
                    // vertex pos
                    unpacked.data.push(vertices[(vertex[0] - 1) * 3 + 0]);
                    unpacked.data.push(vertices[(vertex[0] - 1) * 3 + 1]);
                    unpacked.data.push(vertices[(vertex[0] - 1) * 3 + 2]);
                    // vertex norms
                    unpacked.data.push(normals[(vertex[2] - 1) * 3 + 0]);
                    unpacked.data.push(normals[(vertex[2] - 1) * 3 + 1]);
                    unpacked.data.push(normals[(vertex[2] - 1) * 3 + 2]);
                    // vertex uvs
                    if (keepUvs) {
                        unpacked.data.push(uvs[(vertex[1] - 1) * 2 + 0]);
                        unpacked.data.push(uvs[(vertex[1] - 1) * 2 + 1]);
                    }
                    // colors
                    if (color.length !== 0) {
                        unpacked.data.push(...color);
                    }

                    // add the new vertices to the hashindices
                    unpacked.hashIndices[elements[j]] = unpacked.index;
                    unpacked.indices.push(unpacked.index);
                    // increment index counter
                    unpacked.index += 1;
                }
                if (j === 3 && quad) {
                    // add v0/t0/n0 to the indices because this is a quad
                    unpacked.indices.push(unpacked.hashIndices[elements[0]]);
                }
            }
        }
    });
    return {
        data: unpacked.data,
        indices: unpacked.indices,
    };
};
