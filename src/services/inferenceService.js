let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (e) {
  tf = require('@tensorflow/tfjs');
}
const InputError = require('../exceptions/InputError');

async function predictClassification(model, imageBuffer) {
  try {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
      throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
    }
    
    if (!tf.node || !tf.node.decodeImage) {
      throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
    }
    
    // Coba decode gambar, jika gagal langsung throw error
    const tensor = tf.node
      .decodeImage(imageBuffer, 3)
      .resizeNearestNeighbor([224, 224])
      .expandDims()
      .toFloat();

    const prediction = model.predict(tensor);
    const score = await prediction.data();
    const confidenceScore = score[0] * 100;

    let result = 'Non-cancer';
    let suggestion = 'Penyakit kanker tidak terdeteksi.';

    if (confidenceScore > 50) {
      result = 'Cancer';
      suggestion = 'Segera periksa ke dokter!';
    }

    // Bebaskan tensor untuk menghindari memory leak
    tensor.dispose();
    if (prediction) prediction.dispose();

    return { confidenceScore, result, suggestion };
  } catch (error) {
    console.error('Inference error details:', error);
    throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
  }
}

module.exports = predictClassification;
