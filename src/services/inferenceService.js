let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (e) {
  tf = require('@tensorflow/tfjs');
}

async function predictClassification(model, imageBuffer) {
  try {
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

    return { confidenceScore, result, suggestion };
  } catch (error) {
    console.error('Inference error details:', error);
    throw new Error('Terjadi kesalahan dalam melakukan prediksi');
  }
}

module.exports = predictClassification;
