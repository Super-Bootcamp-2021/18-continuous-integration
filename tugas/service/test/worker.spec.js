/* eslint-disable no-undef */
const orm = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { WorkerSchema } = require('../worker/worker.model');
const { TaskSchema } = require('../tasks/task.model');
const workerServer = require('../worker/server');
const FormData = require('form-data');
const fs = require('fs');
const { truncate } = require('../worker/worker');
const http = require('http');
const { config } = require('../config');

function request(options, form = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      if (res.statusCode === 404) {
        reject(ERROR_WORKER_NOT_FOUND);
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

async function addData() {
  const form = new FormData();
  form.append('name', 'user 1');
  form.append('age', 29);
  form.append('bio', 'test');
  form.append('address', 'jkt');
  form.append('photo', fs.createReadStream('assets/nats.png'));

  const response = await new Promise((resolve, reject) => {
    form.submit(
      `http://localhost:${config.serverWorker.port}/register`,
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
  return JSON.parse(response);
}

describe('worker', () => {
  let connection;
  beforeAll(async () => {
    try {
      connection = await orm.connect(
        [WorkerSchema, TaskSchema],
        config.database
      );
    } catch (err) {
      console.error('database connection failed');
    }
    try {
      await storage.connect('task-manager', config.storage);
    } catch (err) {
      console.error(err);
      console.error('object storage connection failed');
    }
    try {
      await bus.connect();
    } catch (err) {
      console.error('message bus connection failed');
    }
    workerServer.run();
  });
  beforeEach(async () => {
    await truncate();
  });
  afterAll(async () => {
    //await truncate();
    await connection.close();
    bus.close();
    workerServer.stop();
  });
  it('get worker', async () => {
    const options = {
      hostname: 'localhost',
      port: config.serverWorker.port,
      path: '/list',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await request(options);
    const data = JSON.parse(response);
    expect(data).toHaveLength(0);
  });

  it('add worker', async () => {
    const data = await addData();
    expect(data.name).toBe('user 1');
    expect(data.age).toBe(29);
    expect(data.bio).toBe('test');
    expect(data.address).toBe('jkt');
  });

  it('get info worker', async () => {
    const data = await addData();
    const options = {
      hostname: 'localhost',
      port: config.serverWorker.port,
      path: `/info?id=${data.id}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await request(options);
    const data2 = JSON.parse(response);
    expect(data2.name).toBe('user 1');
    expect(data2.age).toBe(29);
    expect(data2.bio).toBe('test');
    expect(data2.address).toBe('jkt');
  });
});
