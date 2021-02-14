/* eslint-disable no-undef */
const { connect } = require('../../lib/orm');
const { WorkerSchema } = require('../../worker/worker.model');

const bus = require('../../lib/bus');
const storage = require('../../lib/storage');
const { config } = require('../../config');
const workerServer = require('../../worker/server');

const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');
const worker = require('../../worker/worker');

async function workerServerSetup() {
  try {
    await storage.connect('photo', config.minio);
  } catch (err) {
    console.error('object storage connection failed', err);
  }
  workerServer.run();
}

async function initWorkerData() {
  try {
    const form = new FormData();
    const pathFile = path.resolve(__dirname, '../worker/profile.jpeg');
    const file = fs.createReadStream(pathFile);
    form.append('name', 'budiman');
    form.append('address', 'jakarta');
    form.append('age', 20);
    form.append('bio', 'suka olahraga');
    form.append('photo', file);

    const response = await new Promise((resolve, reject) => {
      form.submit('http://localhost:7001/register', function (err, res) {
        if (err) {
          reject(err);
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          const result = JSON.parse(data);
          resolve(result);
        });
      });
    });
    return response;
  } catch (error) {
    console.log(eror);
  }
}

function request(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        let result;
        try {
          result = JSON.parse(data);
        } catch (error) {
          result = data;
        }
        resolve({ code: res.statusCode, data: result });
      });
      res.on('error', (err) => {
        reject((err && err.message) || err.toString());
      });
    });
    req.on('error', (error) => {
      console.error(error);
    });
    req.end();
  });
}

describe('Task Add', () => {
  let connection;

  beforeAll(async () => {
    //orm
    try {
      connection = await connect([WorkerSchema], config.pg);
    } catch (err) {
      console.error('database connection failed');
    }

    //nats
    try {
      await bus.connect();
    } catch (err) {
      console.error('message bus connection failed');
    }

    await workerServerSetup();
  });

  afterAll(async () => {
    await worker.truncate();
    await connection.close();
    bus.close();
    workerServer.stop();
  });

  describe('remove worker', () => {
    let workerData;
    beforeEach(async () => {
      workerData = await initWorkerData();
    });

    it('should success remove task', async () => {
      const options = {
        hostname: 'localhost',
        port: 7001,
        path: `/remove?id=${workerData.id}`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const response = await request(options);

      expect(response.code).toBe(200);
      expect(response.data).toHaveProperty('id', workerData.id);
    });

    it('should error parameter id not found', async () => {
      const options = {
        hostname: 'localhost',
        port: 7001,
        path: `/remove`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const response = await request(options);

      expect(response.code).toBe(401);
      expect(response.data).toBe('parameter id tidak ditemukan');
    });

    it('should error worker not found', async () => {
      const options = {
        hostname: 'localhost',
        port: 7001,
        path: `/remove?id=900`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const response = await request(options);

      expect(response.code).toBe(404);
      expect(response.data).toBe(worker.ERROR_WORKER_NOT_FOUND);
    });
  });
});
