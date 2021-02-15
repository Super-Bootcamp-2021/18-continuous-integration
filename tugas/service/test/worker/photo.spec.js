// /* eslint-disable no-undef */

const orm = require('../../lib/orm');
const storage = require('../../lib/storage');
const bus = require('../../lib/bus');
const { WorkerSchema } = require('../../worker/worker.model');
const workerServer = require('../../worker/server');
const FormData = require('form-data');
const fs = require('fs');
const { truncate } = require('../../worker/worker');
const http = require('http');

function request(options, form = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      // if (res.statusCode === 404) {
      //   reject(ERROR_WORKER_NOT_FOUND);
      // }
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

describe('Get Photo Worker', () => {
  let connection;
  beforeAll(async () => {
    try {
      connection = await orm.connect([WorkerSchema], {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'testing',
        password: '',
        database: 'sanbercode5',
      });
    } catch (err) {
      console.error('database connection failed');
    }
    try {
      await storage.connect('photo', {
        endPoint: '192.168.0.8',
        port: 9000,
        useSSL: false,
        accessKey: 'minioadmin',
        secretKey: 'minioadmin',
      });
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
    try {
      const form = new FormData();
      form.append('name', 'user 1');
      form.append('age', 29);
      form.append('bio', 'test');
      form.append('address', 'jkt');
      form.append('photo', fs.createReadStream('assets/nats.png'));

      await new Promise((resolve, reject) => {
        form.submit('http://localhost:7001/register', function (err, res) {
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
        });
      });
    } catch (err) {
      console.error(err);
    }
  });
  afterAll(async () => {
    //await truncate();
    await connection.close();
    bus.close();
    workerServer.stop();
  });

  it('get photo', async () => {
    const options = {
      hostname: 'localhost',
      port: 7001,
      path: `/list`,
      method: 'GET',
    };

    let photoName;
    try {
      const response = await request(options);
      const data = JSON.parse(response);
      photoName = data[0].photo;
    } catch (err) {
      console.error(err);
    }

    options.path = `/photo/${photoName}`;

    try {
      const response = await request(options);
      expect(response).toBeTruthy();
    } catch (err) {
      console.error(err);
    }
  });

  it('error get photo', async () => {
    const options = {
      hostname: 'localhost',
      port: 7001,
      path: '/photo/img.jpg',
      method: 'GET',
    };
    // expect(async () => {
    //   const res = await request(options)
    //   console.log(res)
    // }).toThrow();
      const response = await request(options);
      expect(response).toBe('error file tidak ditemukan');
  });
});
