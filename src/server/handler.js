const predictClassification = require('../services/inferenceService');
const { storeData, getHistories } = require('../services/storeData');
const { v4: uuidv4 } = require('uuid');

async function postPredictHandler(request, h) {
  const { image } = request.payload;
  const { model } = request.server.app;

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  // Jalankan prediksi
  const { confidenceScore, result, suggestion } = await predictClassification(model, image);

  const data = {
    id,
    result,
    suggestion,
    createdAt
  };

  // Simpan ke database Firestore
  await storeData(id, data);

  const response = h.response({
    status: 'success',
    message: 'Model is predicted successfully',
    data
  });
  response.code(201);
  return response;
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
