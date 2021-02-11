/* eslint-disable no-undef */
const orm = require('../lib/orm');
const { WorkerSchema } = require('../worker/worker.model');
const workerServer = require('../worker/server');
const fetch = require('node-fetch');
const kv = require('../lib/kv');
const bus = require('../lib/bus');
const path = require('path');
const {createReadStream} = require('fs');
const FormData = require('form-data');



async function onStop() {
  bus.close();
  kv.close();
}

describe('worker', () => {
  let connection;
  let stream;
  beforeAll(async () => {
    // connection = await orm.connect([WorkerSchema], {
    //   type: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   username: 'postgres',
    //   password: 'passpostgres1997',
    //   database: 'sanbercode2',
    // });
    //workerServer.run(onStop);
    stream = createReadStream(path.resolve(__dirname, 'gambar1.jpeg'));
  });

  // beforeEach(async () => {
  //   await fetch('http://localhost:7001/register', {
  //     method: 'post',
  //     body: JSON.stringify({           
          // name: 'Moh. Ilham Burhanuddin', 
          // age: 23, 
          // bio: 'ini adalah bio ilham', 
          // address: 'Madura', 
          // photo: stream
  //     }),
  //     headers: { 'Content-type': 'application/json' },
  //   });
  // });

  afterAll(async () => {
    //await truncate();
    // await connection.close();
    // workerServer.stop();
  });

  describe('list', () => {
    it('add list',  async () => {
      const form = new FormData();
      form.append('name', 'Moh. Ilham Burhanuddin');
      form.append('age', '23');
      form.append('bio', 'ini adalah bio ilham');
      form.append('address', 'Madura');
      form.append('photo', stream);
      const res = await fetch('http://localhost:7001/register', {
        method: 'post',
        body: form,
        headers: form.getHeaders()
      });
      const response = await res.json();
      
      expect(response.name).toBe('Moh. Ilham Burhanuddin');

    });

    it.skip('get list', async () => {
      const res = await fetch('http://localhost:7001/list', {
        method: 'get',
        headers: { 'Content-type': 'application/json' },
      })
      const response = await res.json();
      expect(response).toHaveLength(1);
    })
  });
});
