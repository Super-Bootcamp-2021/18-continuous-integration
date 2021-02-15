/* eslint-disable no-undef */
const orm = require('../../lib/orm');
const storage = require('../../lib/storage');
const bus = require('../../lib/bus');
const { WorkerSchema } = require('../../worker/worker.model');
const workerServer = require('../../worker/server');
const { truncate } = require('../../worker/worker');
const http = require('http');
const { config } = require('../../config');

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

describe('worker', () => {
  let connection;
  beforeAll(async () => {
    try {
      connection = await orm.connect([WorkerSchema], config.pg);
    } catch (err) {
      console.error('database connection failed');
    }
    try {
      await storage.connect('photo', config.minio);
    } catch (err) {
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

  // describe('Success', () => {
  it('get worker', async () => {
    const options = {
      hostname: 'localhost',
      port: 7001,
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
  // });

  // describe('Error', () => {
  it.skip("couldn't get worker", () => {
    const options = {
      hostname: 'localhost',
      port: 7001,
      path: '/list',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // try {
    //   const response = await request(options);
    // } catch (err) {
    //   // expect(err).toBeFalsy()
    //   expect(err).toThrow(err)
    // }
    expect(async () => {
      await request(options);
    }).toThrow();
  });
  // })
});
