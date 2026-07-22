const Hapi = require('@hapi/hapi');
const ClientError = require('./src/exceptions/ClientError');
const InputError = require('./src/exceptions/InputError');

const init = async () => {
  const server = Hapi.server({ port: 3001, host: 'localhost' });

  server.route({
    method: 'POST',
    path: '/predict',
    handler: async (request, h) => {
      // Simulate throwing InputError
      throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
    }
  });

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof ClientError) {
      const newResponse = h.response({ status: 'fail', message: response.message });
      newResponse.code(response.statusCode);
      return newResponse;
    }
    if (response.isBoom) {
      const originalError = response.data || response.originalError;
      if (originalError instanceof ClientError) {
        const newResponse = h.response({ status: 'fail', message: originalError.message });
        newResponse.code(originalError.statusCode);
        return newResponse;
      }
      if (request.path === '/predict') {
        const newResponse = h.response({ status: 'fail', message: 'Terjadi kesalahan dalam melakukan prediksi' });
        newResponse.code(400);
        return newResponse;
      }
    }
    return h.continue;
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);

  const fetch = require('node-fetch');
  const res = await fetch(server.info.uri + '/predict', { method: 'POST' });
  console.log('Status:', res.status);
  console.log('Body:', await res.json());

  await server.stop();
};

init();
