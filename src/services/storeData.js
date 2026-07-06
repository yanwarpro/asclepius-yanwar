const { Firestore } = require('@google-cloud/firestore');

// Inisialisasi Firestore. Kredensial akan di-infer secara otomatis
// melalui Application Default Credentials (ADC) baik di GCP maupun lokal.
const db = new Firestore();

async function storeData(id, data) {
  const predictCollection = db.collection('predictions');
  return predictCollection.doc(id).set(data);
}

async function getHistories() {
  const predictCollection = db.collection('predictions');
  const snapshot = await predictCollection.get();
  
  const histories = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    histories.push({
      id: doc.id,
      history: {
        result: data.result,
        createdAt: data.createdAt,
        suggestion: data.suggestion,
        id: doc.id
      }
    });
  });
  
  return histories;
}

module.exports = { storeData, getHistories };
