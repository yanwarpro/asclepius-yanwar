require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const tf = require('@tensorflow/tfjs-node');

async function loadModel() {
  const modelUrl = process.env.MODEL_URL || 'https://storage.googleapis.com/submissions-model/assets/model.json';
  console.log(`Loading model from: ${modelUrl}`);
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

    if (response.isBoom) {
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
