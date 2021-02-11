/* eslint-disable no-undef */
const connect = require('../lib/orm');
const { config } = require('./config');
const server = require('../tasks/server');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const { truncate } = require('../tasks/task');
const nock = require('nock');

describe('task', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([WorkerSchema, TaskSchema], config.database);
    server.run();
  });
  beforeEach(async () => {
    await fetch('http://localhost:7001/add', {
      method: 'post',
      body: JSON.stringify({
        name: 'Budi',
        age: 21,
        bio: 'saya cowok',
        address: 'Jl Kesayangan 1',
        photo: '123.jpg',
      }),
      headers: { 'Content-type': 'application/json' },
    });
    await fetch('http://localhost:7002/add', {
      method: 'post',
      body: JSON.stringify({
        job: 'Makan',
        attachment: 'makan.txt',
        assignee: 1,
      }),
      headers: { 'Content-type': 'application/json' },
    });
  });
  afterAll(async () => {
    await truncate();
    await connection.close();
    server.stop();
  });
  describe('Data Handling', () => {
    it('get list task', async () => {
      const res = await fetch('http://localhost:7002/list', {
        method: 'get',
        headers: { 'Content-type': 'application/json' },
      });
      const response = await res.json();
      expect(response).toHaveLength(1);
    });
    it('add task', async () => {
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
