/* eslint-disable no-undef */
const { connect } = require('../lib/orm');
const { config } = require('../config');
const taskServer = require('../tasks/server');
const workerServer = require('../worker/server');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const { truncate } = require('../tasks/task');
const FormData = require('form-data');
const fs = require('fs');
const http = require('http');
const nock = require('nock');

function request(options, form = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      if (res.statusCode === 404) {
        reject(ERROR_TASK_NOT_FOUND);
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

describe('task', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([WorkerSchema, TaskSchema], config.database);
    taskServer.run();
    workerServer.run();
  });
  beforeEach(async () => {
    await truncate();
  });
  // beforeEach(async () => {
  //   await fetch('http://localhost:7001/add', {
  //     method: 'post',
  //     body: JSON.stringify({
  //       name: 'Budi',
  //       age: 21,
  //       bio: 'saya cowok',
  //       address: 'Jl Kesayangan 1',
  //       photo: '123.jpg',
  //     }),
  //     headers: { 'Content-type': 'application/json' },
  //   });
  //   await fetch('http://localhost:7002/add', {
  //     method: 'post',
  //     body: JSON.stringify({
  //       job: 'Makan',
  //       attachment: 'makan.txt',
  //       assignee: 1,
  //     }),
  //     headers: { 'Content-type': 'application/json' },
  //   });
  // });
  afterAll(async () => {
    await truncate();
    await connection.close();
    taskServer.stop();
    workerServer.stop();
  });
  describe('Data Handling', () => {
    it('get list task', async () => {
      const response = await request(`http://localhost:${config.server.taskPort}/list`);
      const data = JSON.parse(response);
      expect(data).toHaveLength(0);
    });
    it.only('add task', async () => {
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: '/list',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      const test = 'add task';
      expect(test).toBe('add task');
    });
    it('get list worker', async () => {
      const test = 'get list worker';
      expect(test).toBe('get list worker');
    });

    describe('Update Status', () => {
      it('update status to be done', async () => {
        const test = 'update status to be done';
        expect(test).toBe('update status to be done');
      });
      it('update status to be cancelled', async () => {
        const test = 'update status to be cancelled';
        expect(test).toBe('update status to be cancelled');
      });
    })
    describe('Attachment', () => {
      it('show attachment', async () => {
        const test = 'show attachment';
        expect(test).toBe('show attachment');
      });
    })
  });
  describe('Error Handling', () => {
    it('form not completed', async () => {
      const test = 'form not completed';
      expect(test).toBe('form not completed');
    });
    it('failed to load task', async () => {
      const test = 'failed to load task';
      expect(test).toBe('failed to load task');
    });
    it('failed to load worker', async () => {
      const test = 'failed to load worker';
      expect(test).toBe('failed to load worker');
    });

    describe('Update Status', () => {
      it('failed to update status to be done', async () => {
        const test = 'failed to update status to be done';
        expect(test).toBe('failed to update status to be done');
      });
      it('failed to update status to be cancelled', async () => {
        const test = 'failed to update status to be cancelled';
        expect(test).toBe('failed to update status to be cancelled');
      });
    })
  })
});
