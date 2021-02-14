/* eslint-disable no-undef */
const taskServer = require('../tasks/server');
const workerServer = require('../worker/server');
const { truncate } = require('../tasks/task');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const { connect } = require('../lib/orm');
const { config } = require('../config');
const fetch = require('node-fetch');
const nock = require('nock');
const fs = require('fs');
const http = require('http');
const FormData = require('form-data');
const path = require('path');

async function addTask() {
  const form = new FormData();
  form.append('job', 'test');
  form.append('assignee_id', '3');
  form.append(
    'attachment',
    fs.createReadStream(path.resolve(__dirname, '../test-src/test.jpg'))
  );

  const req = http.request(
    {
      host: 'localhost',
      port: '7002',
      path: '/add',
      method: 'POST',
      headers: form.getHeaders(),
      body: form,
    },
    (res) => {
      console.log(res.statusCode);
    }
  );
  req.end();
}

describe('tasks', () => {
  describe('list', () => {
    let connection;
    beforeAll(async () => {
      connection = await connect([WorkerSchema, TaskSchema], config.database);
      taskServer.run();
      workerServer.run();
    });
    afterAll(() => {
      connection.close();
      taskServer.stop();
      workerServer.stop();
    });
    it.skip('add list', async () => {
      const res = await fetch('http://localhost:7002/add', {
        method: 'post',
        body: JSON.stringify({
          task: 'test 2',
          done: false,
        }),
        headers: { 'Content-type': 'application/json' },
      });
      const response = await res.json();
      expect(response.task).toBe('test 2');
    });

    it('get list', async () => {
      try {
        await truncate();
        await addTask();
        const res = await fetch('http://localhost:7002/list', {
          method: 'get',
          headers: { 'Content-type': 'application/json' },
        });
      } catch (err) {
        console.log(err);
      }
      expect().toHaveLength(1);

    });

    it.skip('done task', async () => {
      const get = await fetch('http://localhost:7002/list', {
        method: 'get',
        headers: { 'Content-type': 'application/json' },
      });
      const lists = await get.json();

      const res = await fetch(`http://localhost:7002/done?id=${lists[0].id}`, {
        method: 'put',
        headers: { 'Content-type': 'application/json' },
      });
      const response = await res.json();
      expect(response.done).toBeTruthy();
    });

    it.skip('get list with nock', async () => {
      nock('http://localhost:7002')
        .get('/list')
        .reply(200, [
          {
            id: 1,
            task: 'makan',
            done: true,
          },
          {
            id: 2,
            task: 'minum',
            done: false,
          },
        ]);

      const res = await fetch('http://localhost:7002/list', {
        method: 'get',
        headers: { 'Content-type': 'application/json' },
      });
      const response = await res.json();
      expect(response).toHaveLength(2);
      expect(response[0].done).toBeTruthy();
    });
  });
});
