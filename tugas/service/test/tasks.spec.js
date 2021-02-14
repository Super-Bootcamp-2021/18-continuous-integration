/* eslint-disable no-undef */
const orm = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { WorkerSchema } = require('../worker/worker.model');
const { TaskSchema } = require('../tasks/task.model');
const workerServer = require('../worker/server');
const taskServer = require('../tasks/server');
const FormData = require('form-data');
const fs = require('fs');
const { truncate } = require('../worker/worker');
const http = require('http');

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
      connection = await orm.connect([WorkerSchema, TaskSchema], {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'root',
        database: 'sanbercode2',
      });
    } catch (err) {
      console.error('database connection failed');
    }
    try {
      await storage.connect('task-manager', {
        endPoint: '127.0.0.1',
        port: 9000,
        useSSL: false,
        accessKey: 'local-minio',
        secretKey: 'pass-minio',
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
    taskServer.run();
  });
  beforeEach(async () => {
    await truncate();
  });
  afterAll(async () => {
    //await truncate();
    await connection.close();
    bus.close();
    workerServer.stop();
    taskServer.stop();
  });

  describe('worker', () => {
    it('get worker', async () => {
      const options = {
        hostname: 'localhost',
        port: 7002,
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

    it('add task', async () => {
      const form = new FormData();
      form.append('name', 'user 1');
      form.append('age', 29);
      form.append('bio', 'test');
      form.append('address', 'jkt');
      form.append('photo', fs.createReadStream('assets/nats.png'));

      const res = await new Promise((resolve, reject) => {
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
      const worker = JSON.parse(res);

      const formTask = new FormData();
      formTask.append('job', 'makan');
      formTask.append('assignee_id', worker?.id);
      formTask.append('attachment', fs.createReadStream('assets/nats.png'));

      const response = await new Promise((resolve, reject) => {
        formTask.submit('http://localhost:7002/add', function (err, res) {
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
      expect(data.job).toBe('makan');
    });

    it('task done', async () => {
      const form = new FormData();
      form.append('name', 'user 1');
      form.append('age', 29);
      form.append('bio', 'test');
      form.append('address', 'jkt');
      form.append('photo', fs.createReadStream('assets/nats.png'));

      const res = await new Promise((resolve, reject) => {
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
      const worker = JSON.parse(res);

      const formTask = new FormData();
      formTask.append('job', 'makan');
      formTask.append('assignee_id', worker.id);
      formTask.append('attachment', fs.createReadStream('assets/nats.png'));

      const resp = await new Promise((resolve, reject) => {
        formTask.submit('http://localhost:7002/add', function (err, res) {
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

      const data = JSON.parse(resp);
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: `/done?id=${data.id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const response = await request(options);
      const task = JSON.parse(response);
      expect(task.done).toBeThruty;
    });
    it('task cancel', async () => {
      const form = new FormData();
      form.append('name', 'user 1');
      form.append('age', 29);
      form.append('bio', 'test');
      form.append('address', 'jkt');
      form.append('photo', fs.createReadStream('assets/nats.png'));

      const res = await new Promise((resolve, reject) => {
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
      const worker = JSON.parse(res);

      const formTask = new FormData();
      formTask.append('job', 'makan');
      formTask.append('assignee_id', worker.id);
      formTask.append('attachment', fs.createReadStream('assets/nats.png'));

      const resp = await new Promise((resolve, reject) => {
        formTask.submit('http://localhost:7002/add', function (err, res) {
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

      const data = JSON.parse(resp);
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: `/cancel?id=${data.id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const response = await request(options);
      const task = JSON.parse(response);
      expect(task.cancelled).toBeThruty;
    });
  });
});
