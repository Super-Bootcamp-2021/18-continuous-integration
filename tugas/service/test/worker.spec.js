/* eslint-disable no-undef */
const { connect } = require('../lib/orm');
const { WorkerSchema } = require('../worker/worker.model');
// const { config } = require('../config');
const server = require('../worker/server');
// const fetch = require('node-fetch');
// const { truncate } = require('../todo');
// const nock = require('nock');
const http = require('http');

describe('Workers Test', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([WorkerSchema], {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123',
      database: 'database',
    });
    server.run();
  });
  beforeEach(async () => {
    const postData = JSON.stringify({
      name: 'budi',
      age: 23,
      bio: 'doyan makan',
      address: 'Jakarta',
      photo: 'worker.jpg',
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(
      `http://localhost:7001/register`,
      options,
      (res) => {
        res.setEncoding('utf8');
        let response = '';
        res.on('data', (d) => {
          response += d;
        });
        res.on('end', () => {
          // const parsedData = JSON.parse(response);
          console.log(response);
        });
      }
    );

    // Write data to request body
    req.write(postData);
    req.end();
  });
  afterAll(async () => {
    await connection.close();
    server.stop();
  });

  describe('Workers', () => {
    // it('add list', async () => {
    //   const res = await fetch('http://localhost:7001/register', {
    //     method: 'post',
    //     body: JSON.stringify({
    //       name: 'budi',
    //       age: 23,
    //       bio: 'doyan makan',
    //       address: 'Jakarta',
    //       photo: 'worker.jpg',
    //     }),
    //     headers: { 'Content-type': 'application/json' },
    //   });
    //   const response = await res.json();
    //   expect(response.name).toBe('budi');
    // });

    it('get list worker', async () => {
      http.get('http://localhost:7001/list', (res) => {
        let response = '';
        res.on('data', (d) => {
          response += d;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(response);
            expect(parsedData).toHaveLength(2);
          } catch (e) {
            console.error(e.message);
          }
        });
      });
    });

    it('get info worker', async () => {
      http.get('http://localhost:7001/info?id=4', (res) => {
        let response = '';
        res.on('data', (d) => {
          response += d;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(response);
            expect(parsedData.name).toBe('Makmur');
          } catch (e) {
            console.error(e.message);
          }
        });
      });
    });

    it('delete worker', async () => {
      const options = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      http.request('http://localhost:7001/info?id=3', options, (res) => {
        let response = '';
        res.on('data', (d) => {
          response += d;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(response);
            expect(parsedData.name).toBe('Makmur');
          } catch (e) {
            console.error(e.message);
          }
        });
      });
    });
  });
});
