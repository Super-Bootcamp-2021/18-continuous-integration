/* eslint-disable no-undef */
const orm = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { config } = require('../config');
const taskServer = require('../tasks/server');
const workerServer = require('../worker/server');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const {
  truncate,
  ERROR_TASK_DATA_INVALID,
  ERROR_TASK_ALREADY_DONE,
  ERROR_TASK_NOT_FOUND,
} = require('../tasks/task');
// const nock = require('nock');
const {
  request,
  requestCallback,
  requestOther,
  addTask,
} = require('./request');
const FormData = require('form-data');
const fs = require('fs');
const { ERROR_WORKER_NOT_FOUND } = require('../tasks/worker.client');
const { ERROR_WITHOUT_ID_PARAM } = require('../tasks/task.service');

describe('task', () => {
  let connection;
  let response;
  let data;
  let options;
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
    await truncate();

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

    describe('Update Status', () => {
      it('update status to be done', async () => {
        response = await request(
          `http://localhost:${config.server.taskPort}/list`
        );
        dataTask = JSON.parse(response);

        options = {
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

        options = {
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
        response = await request(
          `http://localhost:${config.server.taskPort}/list`
        );
        data = JSON.parse(response);

        response = await requestCallback(
          `http://localhost:${config.server.taskPort}/attachment/${data[0]['attachment']}`
        );
        expect(response.statusCode).toBe(200);
      });
    });
  });
  describe('Error Handling', () => {
    it('form not completed', async () => {
      const formTask = new FormData();
      formTask.append('job', 'Makan');
      // formTask.append('assignee_id', dataWorker.id);
      formTask.append('attachment', fs.createReadStream('assets/makan.txt'));
      const responseTask = await new Promise((resolve, reject) => {
        formTask.submit(
          `http://localhost:${config.server.taskPort}/add`,
          function (err, res) {
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
          }
        );
      });
      expect(responseTask).toBe(ERROR_TASK_DATA_INVALID);
    });
    it('failed to load task', async () => {
      options = {
        hostname: 'localhost',
        port: config.server.taskPort,
        path: `/done?id=2147483647`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      response = await requestOther(options);
      expect(response).toBe(ERROR_TASK_NOT_FOUND);
    });
    it('failed to load worker', async () => {
      const formTask = new FormData();
      formTask.append('job', 'Makan');
      // Maximum Integer Value 2,147,483,647
      formTask.append('assignee_id', 2147483647);
      formTask.append('attachment', fs.createReadStream('assets/makan.txt'));
      const responseTask = await new Promise((resolve, reject) => {
        formTask.submit(
          `http://localhost:${config.server.taskPort}/add`,
          function (err, res) {
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
          }
        );
      });
      expect(responseTask).toBe(ERROR_WORKER_NOT_FOUND);
    });
    describe('Attachment', () => {
      it('failed - file not found', async () => {
        response = await requestCallback(
          `http://localhost:${config.server.taskPort}/attachment/blabla.file`
        );
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Update Status', () => {
      it('failed to update status to be done', async () => {
        response = await request(
          `http://localhost:${config.server.taskPort}/list`
        );
        dataTask = JSON.parse(response);

        options = {
          hostname: 'localhost',
          port: config.server.taskPort,
          path: `/done?id=${dataTask[0]['id']}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        response = await requestOther(options);
        data = JSON.parse(response);
        expect(data.done).toBeTruthy();

        options = {
          hostname: 'localhost',
          port: config.server.taskPort,
          path: `/done?id=${dataTask[0]['id']}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        response = await requestOther(options);
        expect(response).toBe(ERROR_TASK_ALREADY_DONE);
      });
      it('failed to update status to be cancelled', async () => {
        options = {
          hostname: 'localhost',
          port: config.server.taskPort,
          path: `/cancel?id=2147483647`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        response = await requestOther(options);
        expect(response).toBe(ERROR_TASK_NOT_FOUND);
      });
      it('failed - no id param', async () => {
        options = {
          hostname: 'localhost',
          port: config.server.taskPort,
          path: `/done`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        response = await requestOther(options);
        expect(response).toBe(ERROR_WITHOUT_ID_PARAM);

        options = {
          hostname: 'localhost',
          port: config.server.taskPort,
          path: `/cancel`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        response = await requestOther(options);
        expect(response).toBe(ERROR_WITHOUT_ID_PARAM);
      });
    });
  });
});
