require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const ClientError = require('../exceptions/ClientError');
let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (e) {
  tf = require('@tensorflow/tfjs');
}

async function loadModel() {
  const modelUrl = process.env.MODEL_URL || 'https://storage.googleapis.com/submissionmlgc-yanwar-model/model.json';
  console.log(`Loading model from: ${modelUrl}`);

  if (modelUrl.startsWith('file://')) {
    const fs = require('fs');
    const path = require('path');
    
    // Hapus prefix 'file://'
    let filePath = modelUrl.substring(7);
    // Pada Windows, jika path diawali dengan '/' diikuti drive letter (misal '/d:/...'), buang '/' pertama
    if (filePath.startsWith('/') && (filePath[2] === ':' || filePath[2] === '|')) {
      filePath = filePath.substring(1);
    }

    const localIOHandler = {
      load: async () => {
        const modelJsonContent = fs.readFileSync(filePath, 'utf8');
        const modelJson = JSON.parse(modelJsonContent);
        const modelTopology = modelJson.modelTopology;
        const weightSpecs = modelJson.weightsManifest;

        const weightDataBuffers = [];
        for (const group of weightSpecs) {
          for (const pathStr of group.paths) {
            const weightFilePath = path.join(path.dirname(filePath), pathStr);
            const weightBuffer = fs.readFileSync(weightFilePath);
            weightDataBuffers.push(weightBuffer);
          }
        }
        const weightData = Buffer.concat(weightDataBuffers).buffer;

        return {
          modelTopology,
          weightSpecs: weightSpecs.flatMap(g => g.weights),
          weightData
        };
      }
    };
    return tf.loadGraphModel(localIOHandler);
  }

  return tf.loadGraphModel(modelUrl);
}

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*']
      }
    }
  });

  // Muat model dan simpan ke server.app
  const model = await loadModel();
  server.app.model = model;
  console.log('Model loaded successfully!');

  // Registrasi rute
  server.route(routes);

  // Penanganan error response secara global (Boom interception)
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    if (response.isBoom) {
      const originalError = response.data || response.originalError;
      if (originalError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: originalError.message
        });
        newResponse.code(originalError.statusCode);
        return newResponse;
      }

      const statusCode = response.output.statusCode;

      // Tangani Payload Too Large (413)
      if (statusCode === 413) {
        const newResponse = h.response({
          status: 'fail',
          message: 'Payload content length greater than maximum allowed: 1000000'
        });
        newResponse.code(413);
        return newResponse;
      }

      // Tangani kesalahan pada rute /predict (kembalikan 400 Bad Request)
      if (request.path === '/predict') {
        console.error('Prediction error:', response);
        const newResponse = h.response({
          status: 'fail',
          message: 'Terjadi kesalahan dalam melakukan prediksi'
        });
        newResponse.code(400);
        return newResponse;
      }
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
