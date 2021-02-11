/* eslint-disable no-undef */
const connect = require('../lib/orm');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const { config } = require('./config');

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
    await connection.close();
    server.stop();
  });
  describe('task', () => {
    it('get list task', async () => {
      const res = await fetch('http://localhost:7002/list', {
        method: 'get',
        headers: { 'Content-type': 'application/json' },
      });
      const response = await res.json();
      expect(response).toHaveLength(1);
    });
  });
});
