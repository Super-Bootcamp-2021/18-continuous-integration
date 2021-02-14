/* eslint-disable no-undef */
var http = require('http');
const fs = require('fs');
const db = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const { config } = require('../config');
const server = require('../tasks/server');
const { truncate } = require('../tasks/task');
const worker = require('../worker/worker');
const nock = require('nock');
const FormData = require('form-data');

function req(options, form = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        resolve(
          JSON.stringify({
            data,
            headers: res.headers,
          })
        );
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

describe('Task Service', () => {
  let connDB;
  let connStorage;
  let connBus;

  const dataWorker = {
    address: 'bekasi',
    age: 23,
    bio: 'oke',
    name: 'Ojan',
    photo: 'user-1.jpeg',
  };

  beforeAll(async () => {
    connDB = await db.connect([WorkerSchema, TaskSchema], config.database);
    connStorage = await storage.connect('attachment', config.minio);
    connBus = await bus.connect();
    server.run();
  });

  beforeEach(async () => {
    await truncate();
    await worker.truncate();
    await worker.register(dataWorker);
    const form = new FormData();
    form.append('job', 'makan');
    form.append('assignee_id', 1);
    form.append('attachment', fs.createReadStream('assets/test.jpg'));
    nock('http://localhost:7001').get('/info').query({ id: 1 }).reply(200, {
      address: 'bekasi',
      age: 23,
      bio: 'oke',
      id: 1,
      name: 'Ojan',
      photo: 'user-1.jpeg',
    });

    await new Promise((resolve, reject) => {
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
  });

  afterAll(async () => {
    await truncate();
    await worker.truncate();
    await connDB.close();
    await connStorage.close();
    await connBus.close();
    server.stop();
  });

  describe('Task List', () => {
    it('get task list', async () => {
      const response = JSON.parse(await req('http://localhost:7002/list'));
      const data = JSON.parse(response.data);
      expect(data).toHaveLength(1);
    });

    it('add new task', async () => {
      nock('http://localhost:7001').get('/info').query({ id: 1 }).reply(200, {
        address: 'bekasi',
        age: 23,
        bio: 'oke',
        id: 1,
        name: 'Ojan',
        photo: 'user-1.jpeg',
      });
      const form = new FormData();
      form.append('job', 'menonton');
      form.append('assignee_id', 1);
      form.append('attachment', fs.createReadStream('assets/test.jpg'));

      const taskResponse = await new Promise((resolve, reject) => {
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
      const data = JSON.parse(taskResponse);
      expect(data.job).toBe('menonton');
    });

    it('done task', async () => {
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: '/done?id=1',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const res = JSON.parse(await req(options));
      const data2 = JSON.parse(res.data);
      expect(data2.done).toBeTruthy();
    });

    it('cancel task', async () => {
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: '/cancel?id=1',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const res = JSON.parse(await req(options));
      const data = JSON.parse(res.data);
      expect(data.cancelled).toBeTruthy();
    });

    it('get attachment', async () => {
      const resList = JSON.parse(await req('http://localhost:7002/list'));
      const obj = JSON.parse(resList.data);
      const file = obj[0].attachment;
      const res = await req(`http://localhost:7002/attachment/${file}`);
      const obj2 = JSON.parse(res);
      expect(obj2.headers['content-type']).toBe('image/jpeg');
    });
  });
});
