const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
    env: {
        browser: true,
        es2020: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
    },
    rules: {
        'valid-jsdoc': ERROR,
        'require-jsdoc': ERROR,
        'no-unused-vars': WARN,
        eqeqeq: 'error',
        'no-plusplus': OFF,
        'no-bitwise': OFF,
        'no-param-reassign': OFF,
        indent: [ERROR, 4],
        quotes: [ERROR, 'single'],
        'no-console': OFF,
        'consistent-return': OFF,
        'no-use-before-define': OFF,
        'global-require': OFF,
    },
};
