const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  try {
    const form = new FormData();
    // sending a text file as image
    fs.writeFileSync('test.txt', 'This is a text file, not an image.');
    form.append('image', fs.createReadStream('test.txt'));
    
    const res = await fetch('http://localhost:3000/predict', {
      method: 'POST',
      body: form
    });
    
    console.log('Status Code:', res.status);
    console.log('Response:', await res.json());
  } catch (err) {
    console.error(err);
  }
}

test();
