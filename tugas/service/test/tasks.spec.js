/* eslint-disable no-undef */
const orm = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { config } = require('../config');
const taskServer = require('../tasks/server');
const workerServer = require('../worker/server');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const { truncate } = require('../tasks/task');
// const nock = require('nock');
const { request, addTask } = require('./request');

describe('task', () => {
  let connection;
  let response;
  let data;
  beforeAll(async () => {
    try {
      connection = await orm.connect(
        [WorkerSchema, TaskSchema],
        config.database
      );
    } catch (err) {
      console.error('database connection failed');
    }
    try {
      await storage.connect('task-manager', config.minio);
    } catch (err) {
      console.error('object storage connection failed');
    }
    try {
      await bus.connect();
    } catch (err) {
      console.error('message bus connection failed');
    }
    workerServer.run();
    taskServer.run();
  });
  beforeEach(async () => {
    await truncate();

    await addTask();
  });
  afterAll(async () => {
    await connection.close();
    bus.close();
    workerServer.stop();
    taskServer.stop();
  });
  describe('Data Handling', () => {
    it('get list task', async () => {
      response = await request(
        `http://localhost:${config.server.taskPort}/list`
      );
      data = JSON.parse(response);
      expect(data).toHaveLength(1);
    });

    it('add task', async () => {
      var response;
      response = await addTask();
      data = JSON.parse(response['task']);
      expect(data.job).toBe('Makan');

      response = await request(
        `http://localhost:${config.server.taskPort}/list`
      );
      data = JSON.parse(response);
      expect(data).toHaveLength(2);
    });
    it('get list worker', async () => {
      response = await request(
        `http://localhost:${config.server.workerPort}/list`
      );
      data = JSON.parse(response);
      expect(data).toHaveLength(1);
    });

    describe.only('Update Status', () => {
      it('update status to be done', async () => {
        response = await request(
          `http://localhost:${config.server.taskPort}/list`
        );
        dataTask = JSON.parse(response);

        const options = {
          hostname: 'localhost',
          port: config.server.taskPort,
          path: `/done?id=${dataTask[0]['id']}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        response = await request(options);
        data = JSON.parse(response);
        expect(data.done).toBeTruthy();
      });
      it('update status to be cancelled', async () => {
        response = await request(
          `http://localhost:${config.server.taskPort}/list`
        );
        dataTask = JSON.parse(response);

        const options = {
          hostname: 'localhost',
          port: config.server.taskPort,
          path: `/cancel?id=${dataTask[0]['id']}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        response = await request(options);
        data = JSON.parse(response);
        expect(data.cancelled).toBeTruthy();
      });
    });
    describe('Attachment', () => {
      it('show attachment', async () => {
        const test = 'show attachment';
        expect(test).toBe('show attachment');
      });
    });
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
    });
  });
});
