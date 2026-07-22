const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream('bad-request.jpg'));
    
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
