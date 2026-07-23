const predictClassification = require('../services/inferenceService');
const { storeData, getHistories } = require('../services/storeData');
const { v4: uuidv4 } = require('uuid');
const InputError = require('../exceptions/InputError');

async function postPredictHandler(request, h) {
  const { image } = request.payload || {};
  const { model } = request.server.app;

  if (!image || !Buffer.isBuffer(image)) {
    throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
  }

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  try {
    const { confidenceScore, result, suggestion } = await predictClassification(model, image);
    const data = {
      id,
      result,
      suggestion,
      createdAt
    };
    await storeData(id, data);

    const response = h.response({
      status: 'success',
      message: 'Model is predicted successfully',
      data
    });
    response.code(201);
    return response;
  } catch (error) {
    if (error instanceof InputError) {
      throw error;
    }
    throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
  }
}

async function getPredictHistoriesHandler(request, h) {
  const data = await getHistories();
  
  const response = h.response({
    status: 'success',
    data
  });
  response.code(200);
  return response;
}

module.exports = { postPredictHandler, getPredictHistoriesHandler };
