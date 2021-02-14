/* eslint-disable no-undef */
var http = require('http');
const fs = require('fs');
const db = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const { config } = require('../config');
const server = require('../worker/server');
const { truncate } = require('../worker/worker');
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

describe('Worker Service ', () => {
  let connDB;
  let connStorage;
  let connBus;

  beforeAll(async () => {
    connDB = await db.connect([WorkerSchema, TaskSchema], config.database);
    connStorage = await storage.connect('photo', config.minio);
    connBus = await bus.connect();
    server.run();
  });

  beforeEach(async () => {
    await truncate();
    const form = new FormData();
    form.append('name', 'ojan');
    form.append('age', 23);
    form.append('bio', 'apa aja boleh');
    form.append('address', 'bekasi');
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
  });

  afterAll(async () => {
    await truncate();
    await connDB.close();
    await connStorage.close();
    await connBus.close();
    server.stop();
  });

  describe('Worker', () => {
    it('Mendapatkan list pekerja', async () => {
      const res = JSON.parse(await req('http://localhost:7001/list'));
      const data = JSON.parse(res.data);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('ojan');
    });

    it('Registrasi pekerja', async () => {
      const form = new FormData();
      form.append('name', 'user 1');
      form.append('age', 29);
      form.append('bio', 'test');
      form.append('address', 'jkt');
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
      const res = JSON.parse(await req('http://localhost:7001/list'));
      const data2 = JSON.parse(res.data);
      expect(data2).toHaveLength(2);
      expect(data.name).toBe('user 1');
    });

    describe('Menampilkan foto', () => {
      it('Berhasil menampilkan foto pekerja', async () => {
        const resList = JSON.parse(await req('http://localhost:7001/list'));
        const obj = JSON.parse(resList.data);
        const file = obj[0].photo;
        const res = await req(`http://localhost:7001/photo/${file}`);
        const obj2 = JSON.parse(res);
        expect(obj2.headers['content-type']).toBe('image/jpeg');
      });
    });

    it('Mendapatkan info pekerja dengan id tertentu', async () => {
      const res = JSON.parse(await req('http://localhost:7001/info?id=1'));
      const data = JSON.parse(res.data);
      expect(data.name).toBe('ojan');
    });

    describe('Remove worker', () => {
      it('Menghapus pekerja dengan id tertentu', async () => {
        const options = {
          hostname: 'localhost',
          port: 7001,
          path: '/remove?id=1',
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        const res = JSON.parse(await req(options));
        const data = JSON.parse(res.data);
        expect(data.name).toBe('ojan');
      });

      it('List pekerja kosong', async () => {
        const options = {
          hostname: 'localhost',
          port: 7001,
          path: '/remove?id=1',
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        await req(options);
        const res = JSON.parse(await req('http://localhost:7001/list'));
        const data = JSON.parse(res.data);
        expect(data.length).toBe(0);
      });
    });
  });
});
