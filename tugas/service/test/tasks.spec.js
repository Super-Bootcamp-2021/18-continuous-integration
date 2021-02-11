/* eslint-disable no-undef */
const { connect } = require('../lib/orm');
const { WorkerSchema } = require('../worker/worker.model');
const { TaskSchema } = require('../tasks/task.model');
const { config } = require('../config');
const server = require('../tasks/server');
const http = require('http');

describe('pekerjaan', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([WorkerSchema, TaskSchema], config.database);
    server.run();
  });

  afterAll(async () => {
    await connection.close();
    server.stop();
  });

  describe('daftar pekerjaan', () => {
    it('mendapatkan daftar dari semua pekerjaan', async () => {
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
      expect(hasil).toHaveLength(8);
    });
  });
});
