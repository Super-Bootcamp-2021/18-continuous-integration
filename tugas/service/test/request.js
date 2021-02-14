const http = require('http');

function postRequest(JSONData, PORT, path) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(JSONData);
    const options = {
      host: 'localhost',
      port: PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };
    const callback = function (res) {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        resolve(data);
      });
      res.on('error', (err) => {
        reject(err);
      });
    };
    const req = http.request(options, callback);
    req.on('error', (err) => {
      console.error(err);
    });
    req.write(postData);
    req.end();
    return;
  });
}

module.exports = {
  postRequest,
};
