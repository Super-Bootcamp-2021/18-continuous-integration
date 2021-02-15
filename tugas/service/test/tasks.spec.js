/* eslint-disable no-undef */
const orm = require('../lib/orm');
const storage = require('../lib/storage');
const bus = require('../lib/bus');
const { WorkerSchema } = require('../worker/worker.model');
const { TaskSchema } = require('../tasks/task.model');
const workerServer = require('../worker/server');
const taskServer = require('../tasks/server');
const FormData = require('form-data');
const fs = require('fs');
const { truncate } = require('../worker/worker');
const { config } = require('../config');

describe('Worker', () => {
  let connection;
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
      await storage.connect('task-manager', config.storage);
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
  });
  afterAll(async () => {
    //await truncate();
    await connection.close();
    bus.close();
    workerServer.stop();
    taskServer.stop();
  });

  it('add task', async () => {
    const form = new FormData();
    form.append('name', 'budi');
    form.append('age', 20);
    form.append('bio', 'test');
    form.append('address', 'jkt');
    form.append('photo', fs.createReadStream('assets/nats.png'));

    const res = await new Promise((resolve, reject) => {
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
    const worker = JSON.parse(res);

    const formTask = new FormData();
    formTask.append('job', 'ngoding');
    formTask.append('assignee_id', worker.id);
    formTask.append('attachment', fs.createReadStream('assets/nats.png'));

    const response = await new Promise((resolve, reject) => {
      formTask.submit('http://localhost:7002/add', function (err, res) {
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
    expect(data.job).toBe('ngoding');
  });
});
