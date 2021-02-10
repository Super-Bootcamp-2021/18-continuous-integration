/* eslint-disable no-undef */
const { connect } = require('../lib/orm');
const { TodoSchema } = require('../todo.model');
const { config } = require('../config');
// const server = require('../server');

const { list, truncate, add } = require('../todo');

describe('todos', () => {
  let connection;
  beforeAll(async () => {
    connection = await connect([TodoSchema], config.database, false);
    // server.run();
  });
  beforeEach(async () => {
    await truncate();

    await add({
      task: 'task 1',
      done: false,
    });
  });
  afterAll(async () => {
    await truncate();
    await connection.close();
    // server.stop();
  });

  describe('list', () => {
    it('get list1', async () => {
      const todos = await list();
      expect(todos).toHaveLength(1);
    });
    it('get list', async () => {
      const todos = await list();
      expect(todos).toHaveLength(1);
    });
  });
});
