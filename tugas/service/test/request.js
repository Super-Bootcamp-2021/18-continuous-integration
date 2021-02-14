const { config } = require('../config');
const FormData = require('form-data');
const fs = require('fs');
const http = require('http');
const { ERROR_TASK_NOT_FOUND } = require('../tasks/task');

function request(options, form = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      if (res.statusCode === 404) {
        reject(ERROR_TASK_NOT_FOUND);
      }
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        resolve(data);
      });
      res.on('error', (err) => {
        reject((err && err.message) || err.toString());
      });
    });
    req.on('error', (error) => {
      console.error(error);
    });
    if (form) {
      form.pipe(req);
      req.on('response', function (res) {
        console.log(res.statusCode);
      });
    } else {
      req.end();
    }
  });
}

function requestOther(options, form = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('error', (err) => {
        console.error(err);
        reject(err);
      });
      res.on('end', () => {
        resolve(data);
      });
    });
    req.on('error', (error) => {
      console.error(error);
    });
    if (form) {
      form.pipe(req);
      req.on('response', function (res) {
        console.log(res.statusCode);
      });
    } else {
      req.end();
    }
  });
}

async function addTask() {
  const formWorker = new FormData();
  formWorker.append('name', 'user 1');
  formWorker.append('age', 29);
  formWorker.append('bio', 'test');
  formWorker.append('address', 'jkt');
  formWorker.append('photo', fs.createReadStream('assets/nats.png'));
  const responseWorker = await new Promise((resolve, reject) => {
    formWorker.submit(
      `http://localhost:${config.server.workerPort}/register`,
      function (err, res) {
        if (err) {
          reject(err);
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          resolve(data);
        });
      }
    );
  });
  const dataWorker = JSON.parse(responseWorker);

  const formTask = new FormData();
  formTask.append('job', 'Makan');
  formTask.append('assignee_id', dataWorker.id);
  formTask.append('attachment', fs.createReadStream('assets/makan.txt'));
  const responseTask = await new Promise((resolve, reject) => {
    formTask.submit(
      `http://localhost:${config.server.taskPort}/add`,
      function (err, res) {
        if (err) {
          reject(err);
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          resolve(data);
        });
      }
    );
  });
  const response = {
    worker: responseWorker,
    task: responseTask,
  };
  return response;
}

module.exports = {
  request,
  requestOther,
  addTask,
};
