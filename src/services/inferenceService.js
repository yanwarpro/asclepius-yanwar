let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (e) {
  tf = require('@tensorflow/tfjs');
}
const InputError = require('../exceptions/InputError');

function isValidImage(buffer) {
  if (!buffer || buffer.length < 100) return false;
  
  // Check JPEG magic number (FF D8)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return true;
  }
  
  // Check PNG magic number (89 50 4E 47 0D 0A 1A 0A)
  if (buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A) {
    return true;
  }
  
  return false;
}

async function predictClassification(model, imageBuffer) {
  try {
    if (!isValidImage(imageBuffer)) {
      throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
    }
    
    if (!tf.node) {
      throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
    }
    
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
    throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
  }
}

module.exports = predictClassification;
