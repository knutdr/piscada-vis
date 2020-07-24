# Visualization of Fish Farm in WebGL

## Installation
### Dependencies
If you just want to run the project you need to install node.js and npm.

### steps
1. Install node.js and npm. 
2. Clone the repo.
3. npm install to get all node modules.
4. npm run buildDev to compile.
5. npm start to start the server.
6. demo should now be available on adress localhost:8080.

## notes
Just a prototype so it has not been tweeked to work well with other browsers than chrome.
Browser needs to have support for webgl2.

See https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial
for an excellent beginners guide to webGL.
Some syntax might differ in the shaders as they use WebGL1 which does not support the GLSL version
used in this project.

See https://www.shaderific.com/glsl/
for an excellent overview over GLSL which is the programming language used in
shaders. Similar to C but there are some differences. In this project the
300 es version has been used.
