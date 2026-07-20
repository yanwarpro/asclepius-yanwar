const { postPredictHandler, getPredictHistoriesHandler } = require('./handler');

const routes = [
  {
    path: '/predict',
    method: 'POST',
    handler: postPredictHandler,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: 1000000, // Limitasi payload maksimal 1MB (1.000.000 bytes)
        output: 'data',
        parse: true
      }
    }
  },
  {
    path: '/predict/histories',
    method: 'GET',
    handler: getPredictHistoriesHandler
  }
];

module.exports = routes;
