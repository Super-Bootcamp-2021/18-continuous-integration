const { connect } = require('../lib/orm');
const { TaskSchema } = require('../tasks/task.model');
const { config } = require('../config');
const server = require('../tasks/server');
const fetch = require('node-fetch');
const { truncate } = require('../tasks/task');
const nock = require('nock');
const { WorkerSchema, Worker } = require('../worker/worker.model');

describe('task', () => {
  let connection;
  beforeEach(async () => {
    connection = await connect([TaskSchema, WorkerSchema], config.database);
    const workerRepo = connection.getRepository('Worker');
    const worker = new Worker(
      null,
      'Hadi',
      30,
      'pedagang',
      'temanggung',
      'hadi.jpg'
    );
    await workerRepo.save(worker);
    const taskRepo = connection.getRepository('Task');
    await taskRepo.save({
      job: 'makan',
      assignee: { id: 1 },
      attachment: 'attachmen.jpg',
    });
    server.run();
  });
  afterEach(async () => {
    await truncate();
    await connection.close();
    server.stop();
  });
  it('coba', async () => {
    const res = await fetch('http://localhost:7002/list', {
      method: 'get',
    });
    const response = await res.json();
    expect(response.length).toEqual(1);
  });
});
