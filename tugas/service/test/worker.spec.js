/* eslint-disable no-undef */

const { connect } = require('../lib/orm');
const { WorkerSchema } = require('../worker/worker.model')
const { config } = require('../config')
const server  = require('../worker/server')
const http = require('http');

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
    connection = await connect([ WorkerSchema ], config.database)
    server.run()
  });
  afterAll(async () => {
    await connection.close();
    server.stop();
  });

  describe('info', () => {
    it('get info', async () => {
     
      function getInfo() {
        return new Promise((resolve,reject) => {
          const req = http.request('http://localhost:7001/info?id=4', (res) => {
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
      expect(hasil.name).toBe('ana');
    });
  });

  describe('list', () => {
    it('get list', async () => {
     
      function getList() {
        return new Promise((resolve,reject) => {
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
      expect(hasil).toHaveLength(5);
    });
  });

//   describe('remove',() => {
//     it('menghapus data pekerja berdasarkan id', async () => {
//       const options = {
//         hostname: 'localhost',
//         port: '7001',
//         path: '/remove',
//         method: 'DELETE',
//       };

//       function removeWorker() {
//         return new Promise((resolve,reject) => {
//           const req = http.request(options, (res) => {
//             let data = '';
//             res.on('data', (chunk) => {
//               data += chunk.toString();
//             });
//             res.on('end', () => {
//               const removeData = JSON.parse(data);
//               resolve(removeData);
//             });
//             res.on('error', (err) => {
//               reject(err);
//             });
//           });
//           req.end();
//         });
//       }

//       const hasil = await removeWorker();
//       expect(hasil.name).toBe('ana');
//     });
//   });
});

