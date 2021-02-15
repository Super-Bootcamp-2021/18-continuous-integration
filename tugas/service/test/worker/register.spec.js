// /* eslint-disable no-undef */
const orm = require('../../lib/orm');
const storage = require('../../lib/storage');
const bus = require('../../lib/bus');
const { WorkerSchema } = require('../../worker/worker.model');
const workerServer = require('../../worker/server');
const FormData = require('form-data');
const fs = require('fs');
const { truncate } = require('../../worker/worker');

describe('Register Worker', () => {
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
      await storage.connect('task-manager', {
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
  });
  afterAll(async () => {
    //await truncate();
    await connection.close();
    bus.close();
    workerServer.stop();
  });

  it('add worker', async () => {
    const form = new FormData();
    form.append('name', 'user 1');
    form.append('age', 29);
    form.append('bio', 'test');
    form.append('address', 'jkt');
    form.append('photo', fs.createReadStream('assets/nats.png'));

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
          resolve(data);
        });
      });
    });

    const data = JSON.parse(response);
    expect(data.name).toBe('user 1');
  });

  it.skip('error add worker', () => {
    const form = new FormData();
    form.append('name', 'user 1');
    form.append('bio', 'test');
    form.append('address', 'jkt');
    form.append('photo', fs.createReadStream('assets/nats.png'));

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
          resolve(data);
        });
      });
    });

    // const data = JSON.parse(response);
    console.log(response)
    // expect(data.name).toBe('user 1');
  })
})
