/* eslint-disable no-undef */

const { connect } = require('../lib/orm');
const { WorkerSchema } = require('../worker/worker.model');
const { config } = require('../config');
const server = require('../worker/server');
const http = require('http');
const FormData = require('form-data');
const fs = require('fs');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { truncate } = require('../worker/worker');

// function request(options, form = null) {
//   return new Promise((resolve, reject) => {
//     const req = http.request(options, (res) => {
//       let data = '';
//       if (res.statusCode === 404) {
//         reject(ERROR_WORKER_NOT_FOUND);
//       }
//       res.on('data', (chunk) => {
//         data += chunk.toString();
//       });
//       res.on('end', () => {
//         resolve(data);
//       });
//       res.on('error', (err) => {
//         reject((err && err.message) || err.toString());
//       });
//     });
//     req.on('error', (error) => {
//       console.error(error);
//     });
//     if (form) {
//       form.pipe(req);
//       req.on('response', function (res) {
//         console.log(res.statusCode);
//       });
//     } else {
//       req.end();
//     }
//   });
// }

describe('worker', () => {
  describe('worker', () => {
    it('get test', async () => {
      const test = 'test';
      expect(test).toBe('test');
    });
  });
});

describe('worker', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([WorkerSchema], config.database);
    bus.connect();
    storage.connect('task-manager', config.objectStorage);
    server.run();
  });
  afterAll(async () => {
    await connection.close();
    server.stop();
    bus.close();
  });

  describe('tambah data pekerja', () => {
    it('bisa menambah data pekerja', async () => {
      truncate();
      const form = new FormData();
      form.append('name', 'Budi');
      form.append('age', 30);
      form.append('bio', 'coba bio');
      form.append('address', 'Yogyakarta');
      form.append('photo', fs.createReadStream('img/dino.png'));

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
      expect(data.name).toBe('Budi');
    });
  });

  describe('info', () => {
    it('get info', async () => {
      function getInfo() {
        return new Promise((resolve, reject) => {
          const req = http.request('http://localhost:7001/info?id=1', (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk.toString();
            });
            res.on('end', () => {
              const showInfo = JSON.parse(data);
              resolve(showInfo);
            });
            res.on('error', (err) => {
              reject(err);
            });
          });
          req.end();
        });
      }

      const hasil = await getInfo();
      expect(hasil.name).toBe('Budi');
    });
  });

  describe('list', () => {
    it('get list', async () => {
      function getList() {
        return new Promise((resolve, reject) => {
          const req = http.request('http://localhost:7001/list', (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk.toString();
            });
            res.on('end', () => {
              const showList = JSON.parse(data);
              resolve(showList);
            });
            res.on('error', (err) => {
              reject(err);
            });
          });
          req.end();
        });
      }

      const hasil = await getList();
      expect(hasil).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('menghapus data pekerja berdasarkan id', async () => {
      const options = {
        hostname: 'localhost',
        port: '7001',
        path: '/remove?id=1',
        method: 'DELETE',
      };

      function removeWorker() {
        return new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk.toString();
            });
            res.on('end', () => {
              const removeData = JSON.parse(data);
              resolve(removeData);
            });
            res.on('error', (err) => {
              reject(err);
            });
          });
          req.end();
        });
      }

      const hasil = await removeWorker();
      expect(hasil.name).toBe('Budi');
    });
  });
});
