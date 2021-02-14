const orm = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { WorkerSchema } = require('../worker/worker.model');
const workerServer = require('../worker/server');
const { truncate } = require('../worker/worker');
const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

function request(options, form = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      if (res.statusCode === 404) {
        reject('pekerja tidak ditemukan');
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
  // const form = new FormData();
  // form.append('id', 2);
  // form.append('name', 'Dani');
  // form.append('age', 22);
  // form.append('photo', fs.createReadStream('./service/test/gambar.jpg'));
  // form.append('bio', 'Hello World!!!');
  // form.append('address', 'Malang');

  beforeAll(async () => {
    try {
      connection = await orm.connect([WorkerSchema], {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'dubnium',
      });
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
    workerServer.run();

    const form = new FormData();
    form.append('name', 'Angga');
    form.append('age', 23);
    form.append('photo', fs.createReadStream('assets/gambar.jpg'));
    form.append('bio', 'Hello World!!!');
    form.append('address', 'Nganjuk');
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

  beforeEach(async () => {});

  afterAll(async () => {
    await truncate();
    await connection.close();
    bus.close();
    workerServer.stop();
  });

  describe('Pekerja', () => {
    it('Seharusnya bisa menampilkan pekerja', async () => {
      // const req = http.request(`http://localhost:7001/list`, (res) => {
      //   let data = '';
      //   res.on('data', (chunk) => {
      //     data += chunk.toString();
      //   });
      //   res.on('end', () => {
      //     const worker = JSON.stringify(data);
      //     const db = JSON.parse(data);
      //     console.log(db);
      //     console.log('DATA: ' + db[0].name);
      //     resolve(worker);
      //     expect(db[0].name).toBe('Dika');
      //   });
      //   res.on('error', (err) => {
      //     reject(err.message || err.toString());
      //   });
      // });
      // req.end();
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
      expect(data).toHaveLength(1);
    });

    it('Seharusnya bisa menambah pekerja', async () => {
      // const request = http.request({
      //   method: 'POST',
      //   host: 'localhost',
      //   port: 7001,
      //   path: '/register',
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      //   formData: {
      //     id: 1,
      //     name: 'Dani',
      //     age: 22,
      //     photo: fs.createReadStream('./service/test/gambar.jpg'),
      //     bio: 'Hello World!!!',
      //     address: 'Malang',
      //   },
      // });

      // form.pipe(request);

      // request.on('response', function (res) {
      //   console.log(res.statusCode);
      //   expect(res.name).toBe('1');
      // });
      const form = new FormData();
      form.append('name', 'Dani');
      form.append('age', 22);
      form.append('photo', fs.createReadStream('assets/gambar.jpg'));
      form.append('bio', 'Hello World!!!');
      form.append('address', 'Malang');
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
      expect(data.name).toBe('Dani');
      expect(data.age).toBe(22);
      expect(data.bio).toBe('Hello World!!!');
      expect(data.address).toBe('Malang');
    });

    it('Seharusnya bisa melihat info pekerja', async () => {
      const options = 'http://localhost:7001/info?id=1';
      const response = await request(options);
      const data = JSON.parse(response);
      expect(data.name).toBe('Angga');
      expect(data.age).toBe(23);
      expect(data.bio).toBe('Hello World!!!');
      expect(data.address).toBe('Nganjuk');
    });

    it('Seharusnya bisa menghapus pekerja', async () => {
      // const response = await new Promise((resolve, reject) => {
      //   const req = http.request('http://localhost:7001/remove?id=1', (res) => {
      //     let data = '';
      //     if (res.statusCode === 404) {
      //       reject('pekerja tidak ditemukan');
      //     }
      //     res.on('data', (chunk) => {
      //       data += chunk.toString();
      //     });
      //     res.on('end', () => {
      //       const worker = JSON.stringify(data);
      //       resolve(worker);
      //     });
      //     res.on('error', (err) => {
      //       reject(err.message || err.toString());
      //     });
      //   });
      //   req.end();
      // });
      const options = {
        host: 'localhost',
        port: 7001,
        path: '/remove?id=1',
        method: 'DELETE',
      };
      const response = await request(options);
      const data = JSON.parse(response);
      expect(data.name).toBe('Angga');
      expect(data.age).toBe(23);
      expect(data.bio).toBe('Hello World!!!');
      expect(data.address).toBe('Nganjuk');
    });

    it('Seharusnya bisa menampilkan gambar pekerja', async () => {
      const options1 = 'http://localhost:7001/list';
      const response1 = await request(options1);
      const data = JSON.parse(response1);
      const photo = data[0].photo;
      let contentType = '';
      await new Promise((resolve, reject) => {
        const req = http.request(
          `http://localhost:7001/photo/${photo}`,
          (res) => {
            let data = '';
            contentType = res.headers['content-type'];
            if (res.statusCode === 404) {
              reject('pekerja tidak ditemukan');
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
          }
        );

        req.on('error', (error) => {
          console.error(error);
        });
        req.end();
      });
      expect(contentType).toBe('image/jpeg');
      // const options2 = `http://localhost:7001/photo/${photo}`;
      // const response2 = await request(options2);
    });
  });
});
