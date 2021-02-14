/* eslint-disable no-undef */
const orm = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { WorkerSchema } = require('../worker/worker.model');
const { TaskSchema } = require('../tasks/task.model');
const workerServer = require('../worker/server');
const FormData = require('form-data');
const fs = require('fs');
const { truncate } = require('../worker/worker');
const http = require('http');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const ERROR_WORKER_NOT_FOUND = 'pekerja tidak ditemukan';

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

describe('Worker Service', () => {
  let connection;
  beforeAll(async () => {
    try {
      connection = await orm.connect([WorkerSchema, TaskSchema], {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgre',
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
  });

  beforeEach(async () => {
    await truncate();
    const form = new FormData();
    form.append('name', 'Andi');
    form.append('age', 20);
    form.append('bio', 'Cita-citaku ingin menjadi hokage');
    form.append('address', 'Konohagakyre');
    form.append('photo', fs.createReadStream('assets/test.jpg'));

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

    const form1 = new FormData();
    form1.append('name', 'Budi');
    form1.append('age', 17);
    form1.append('bio', 'Ingin menguasai Bumi');
    form1.append('address', 'Planet Mars');
    form1.append('photo', fs.createReadStream('assets/test.jpg'));

    await new Promise((resolve, reject) => {
      form1.submit('http://localhost:7001/register', function (err, res) {
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
    //await truncate();
    await connection.close();
    bus.close();
    workerServer.stop();
  });

  describe('Melihat data pekerja', () => {
    it('bisa mengambil data pekerja', async () => {
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
      const data = JSON.parse(response);
      expect(data).toHaveLength(2);
    });

    describe('Menambah data pekerja', () => {
      it('bisa menambah data pekerja', async () => {
        const form = new FormData();
        form.append('name', 'Cindi');
        form.append('age', 21);
        form.append('bio', 'Hidup seperti Larry');
        form.append('address', 'Bikini Bottom');
        form.append('photo', fs.createReadStream('assets/test.jpg'));

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
        expect(data.name).toBe('Cindi');

        const options = {
          hostname: 'localhost',
          port: 7001,
          path: '/list',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        };

        const getAllData = await request(options);
        const allData = JSON.parse(getAllData);
        console.log(allData);
        expect(allData).toHaveLength(3);
      });
    });

    describe('Mencari info pekerja', () => {
      it('bisa mencari info pekerja menggunakan ID', async () => {
        const get = await fetch(
          'http://localhost:7001/info?id=260',
          {
            method: 'get',
            headers: { 'Content-type': 'application/json' },
          }
        );
        console.log(get);
      });
    });
  });
});
