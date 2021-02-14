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
const { truncate } = require('../tasks/task');
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
async function initWorkerDB() {
  const form = new FormData();
  form.append('name', 'user 1');
  form.append('age', 29);
  form.append('bio', 'test');
  form.append('address', 'jkt');
  form.append('photo', fs.createReadStream('service/test/gambar/contoh.jpg'));

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
}

async function findIdWorker() {
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
  return JSON.parse(response)[0].id;
}
async function findIdTask() {
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
  return JSON.parse(response)[0].id;
}
// line testing
describe('Task', () => {
  let connection;
  beforeAll(async () => {
    try {
      connection = await orm.connect([WorkerSchema, TaskSchema], {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'dubnium',
      });
      console.log('database connected');
    } catch (err) {
      console.error('database connection failed');
    }
    try {
      await storage.connect('task-manager', {
        endPoint: '127.0.0.1',
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

    taskServer.run();
    workerServer.run();
    await initWorkerDB();
  });
  beforeEach(async () => {
    // await truncate();
    // await initWorkerDB();
  });
  afterAll(async () => {
    await truncate();
    await connection.close();
    bus.close();
    taskServer.stop();
    workerServer.stop();
  });

  describe('end point task', () => {
    it('harusnya bisa ambil data task', async () => {
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
      const data = response;
      expect(JSON.parse(data)).toHaveLength(0);
    });

    it('harusnya bisa tambah task', async () => {
      const idWorker = await findIdWorker();
      console.log(idWorker);
      const form = new FormData();
      form.append('job', 'main bola');
      form.append('assignee_id', idWorker);
      form.append(
        'attachment',
        fs.createReadStream('service/test/gambar/contoh.jpg')
      );

      const response = await new Promise((resolve, reject) => {
        form.submit('http://localhost:7002/add', function (err, res) {
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

      expect(JSON.parse(response).job).toBe('main bola');
    });

    it('harusnya bisa menyelesaikan task', async () => {
      const idTask = await findIdTask();
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: `/done?id=${idTask}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const respond = await request(options);
      expect(JSON.parse(respond).done).toBe(true);
    });
    it('harusnya bisa membatalkan task', async () => {
      const idTask = await findIdTask();
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: `/cancel?id=${idTask}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const respond = await request(options);
      expect(JSON.parse(respond).cancelled).toBe(true);
    });
  });
});
