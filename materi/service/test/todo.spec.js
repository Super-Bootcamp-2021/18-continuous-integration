/* eslint-disable no-undef */
const { connect } = require('../lib/orm');
const { TodoSchema } = require('../todo.model');
const { config } = require('../config');
const server = require('../server');
const fetch = require('node-fetch');
const { truncate } = require('../todo');
const nock = require('nock');
const FormData = require('form-data');

describe('todos', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([TodoSchema], config.database);
    server.run();
  });
  beforeEach(async () => {
    await truncate();
    await fetch('http://localhost:7767/add', {
      method: 'post',
      body: JSON.stringify({
        task: 'test 2',
        done: false,
      }),
      headers: { 'Content-type': 'application/json' },
    });
  });
  afterAll(async () => {
    await truncate();
    await connection.close();
    server.stop();
  });

  describe('list', () => {
    it('add list', async () => {
      const res = await fetch('http://localhost:7767/add', {
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
      const res = await fetch('http://localhost:7767/list', {
        method: 'get',
        headers: { 'Content-type': 'application/json' },
      });
      const response = await res.json();
      expect(response).toHaveLength(1);
    });

    it('done todo', async () => {
      const get = await fetch('http://localhost:7767/list', {
        method: 'get',
        headers: { 'Content-type': 'application/json' },
      });
      const lists = await get.json();

      const res = await fetch(`http://localhost:7767/done?id=${lists[0].id}`, {
        method: 'put',
        headers: { 'Content-type': 'application/json' },
      });
      const response = await res.json();
      expect(response.done).toBeTruthy();
    });

    it('get list with nock', async () => {
      nock('http://localhost:7767')
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

      const res = await fetch('http://localhost:7767/list', {
        method: 'get',
        headers: { 'Content-type': 'application/json' },
      });
      const response = await res.json();
      expect(response).toHaveLength(2);
      expect(response[0].done).toBeTruthy();
    });
  });
});
