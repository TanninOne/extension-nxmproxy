let webpack = require('vortex-api/bin/webpack').default;

const config = webpack('nxmproxy-integration', __dirname, 5);

delete config.output['library'];

module.exports = config;
