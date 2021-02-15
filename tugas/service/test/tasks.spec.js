/* eslint-disable no-undef */
const { connect } = require('../lib/orm');
const { WorkerSchema } = require('../worker/worker.model');
const { TaskSchema } = require('../tasks/task.model');
const { config } = require('../config');
const server = require('../tasks/server');
const serverWorker = require('../worker/server');
const http = require('http');
const FormData = require('form-data');
const fs = require('fs');
const nock = require('nock');
const bus = require('../lib/bus');
const storage = require('../lib/storage');
const { truncate } = require('../tasks/task');

describe('pekerjaan', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([WorkerSchema, TaskSchema], config.database);
    server.run();
    serverWorker.run();
    bus.connect();
    storage.connect('task-manager', config.objectStorage);
  });

  afterAll(async () => {
    await connection.close();
    server.stop();
    serverWorker.stop();
    bus.close();
  });

  describe('daftar pekerjaan', () => {
    it.only('menambah pekerjaan baru', async () => {
      truncate();
      const formWorker = new FormData();
      formWorker.append('name', 'Budi');
      formWorker.append('age', 30);
      formWorker.append('bio', 'coba bio');
      formWorker.append('address', 'Yogyakarta');
      formWorker.append('photo', fs.createReadStream('img/dino.png'));

      await new Promise((resolve, reject) => {
        formWorker.submit(
          'http://localhost:7001/register',
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

      nock('http://localhost:7001').get('/info?id=1').reply(200, {
        id: 1,
        name: 'Budi',
        age: '30',
        bio: 'coba bio',
        address: 'Yogyakarta',
        photo: '1612852721622-913.png',
      });

      // nock('http://127.0.0.1:9000')
      //   .get('/')
      //   .reply(200, '1612852721235-913.png');

      const options = {
        hostname: 'localhost',
        port: 7002,
        path: '/add',
        method: 'POST',
      };

      var form = new FormData();
      form.append('job', 'belajar continuous-integration');
      form.append('assignee_id', 1);
      form.append('attachment', fs.createReadStream('img/dino.png'));

      function createTask() {
        return new Promise((resolve, reject) => {
          form.submit(options, (err, res) => {
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

            res.on('error', (err) => {
              reject(err);
            });
          });
        });
      }

      const hasil = await createTask();
      expect(hasil.job).toBe('belajar continuous-integration');
    });

    it('mendapatkan daftar dari semua pekerjaan', async () => {
      nock('http://localhost:7001').get('/info?id=1').reply(200, {
        id: 1,
        name: 'budi',
        age: '45',
        bio: 'adsada',
        address: 'adasdada',
        photo: '1612852721622-913.png',
      });

      const optionsCreate = {
        hostname: 'localhost',
        port: 7002,
        path: '/add',
        method: 'POST',
      };

      var form = new FormData();
      form.append('job', 'belajar node js');
      form.append('assignee_id', 1);
      form.append('attachment', fs.createReadStream('./img/dino.png'));

      function createTask() {
        return new Promise((resolve, reject) => {
          form.submit(optionsCreate, (err, res) => {
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

            res.on('error', (err) => {
              reject(err);
            });
          });
        });
      }

      await createTask();

      const options = {
        hostname: 'localhost',
        port: 7002,
        path: '/list',
        method: 'GET',
      };

      function getList() {
        return new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk.toString();
            });

            res.on('end', () => {
              const result = JSON.parse(data);
              resolve(result);
            });

            res.on('error', (err) => {
              reject(err);
            });
          });
          req.end();
        });
      }

      const hasil = await getList();
      expect(hasil).toHaveLength(2);
    });

    it('mengubah status pekerjaan menjadi selesai', async () => {
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: '/done?id=1',
        method: 'PUT',
      };

      function taskDone() {
        return new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk.toString();
            });

            res.on('end', () => {
              const result = JSON.parse(data);
              resolve(result);
            });

            res.on('error', (err) => {
              reject(err);
            });
          });

          req.end();
        });
      }

      const hasil = await taskDone();
      expect(hasil.done).toBeTruthy();
    });

    it('mengubah status pekerjaan menjadi batal', async () => {
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: '/cancel?id=2',
        method: 'PUT',
      };

      function taskDone() {
        return new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk.toString();
            });

            res.on('end', () => {
              const result = JSON.parse(data);
              resolve(result);
            });

            res.on('error', (err) => {
              reject(err);
            });
          });

          req.end();
        });
      }

      const hasil = await taskDone();
      expect(hasil.cancelled).toBeTruthy();
    });
  });
});
