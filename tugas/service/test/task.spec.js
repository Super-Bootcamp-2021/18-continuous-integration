const { connect } = require('../lib/orm');
const { TaskSchema } = require('../tasks/task.model');
const { config } = require('../config');
const server = require('../tasks/server');
const fetch = require('node-fetch');
const { truncate } = require('../tasks/task');
const nock = require('nock');

describe('task', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([TaskSchema], config.database);
    server.run();
  });
  beforeEach(async () => {
    nock('http://localhost:7001')
      .get('/info?id=1')
      .reply(200, [
        {
          id: 1,
          name: 'Hadi',
          age: 31,
          bio: 'pedagang',
          address: 'temanggung',
          photo: 'hadi.jpg',
        }
      ]);

    await truncate();
    await fetch('http://localhost:7002/add', {
      method: 'post',
      body: JSON.stringify({
        job: 'makan',
        assigneeId: 1,
        attachment: 'gambar.jpg',
      }),
      headers: { 'Content-type': 'application/json' },
    });
  });
  afterAll(async () => {
    await truncate();
    await connection.close();
    server.stop();
  });
  it('get list', async () => {
    const res = await fetch('http://localhost:7002/list', {
      method: 'get',
      headers: { 'Content-type': 'application/json' },
    });
    const response = await res.json();
    expect(response).toHaveLength(1);
  });
});
