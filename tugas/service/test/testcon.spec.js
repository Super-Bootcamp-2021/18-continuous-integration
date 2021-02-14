/* eslint-disable no-undef */
const { connect } = require('../lib/orm');
const { TaskSchema } = require('../tasks/task.model');
const { WorkerSchema } = require('../worker/worker.model');
const workerModel = require("../worker/worker");
const taskModel = require("../tasks/task");

const bus = require('../lib/bus');
const storage = require('../lib/storage');
const { config } = require('../config');
const taskServer = require('../tasks/server');
const workerServer = require('../worker/server');


async function workerServerSetup() {
  try {
    await storage.connect('photo', config.minio);
  } catch (err) {
    console.error('object storage connection failed',err);
  }
  workerServer.run();
}

async function taskServerSetup() {
  try {
    await storage.connect('attachment', config.minio);
  } catch (err) {
    console.error('object storage connection failed',err);
  }
  taskServer.run();
}


 

describe('Task Add', () => {
  let connection;
  let success = false;

  

  beforeAll(async () => {
     //orm
    try {
      connection = await connect([TaskSchema,WorkerSchema], config.pg);
    } catch (err) {
      console.error('database connection failed');
    }

    //nats
    try {
      await bus.connect();
    } catch (err) {
      console.error('message bus connection failed');
    }

    await workerServerSetup();
    await taskServerSetup();
    success = true;
  });

  afterAll(async () => {
    await connection.close();
    bus.close();
    workerServer.stop();
    taskServer.stop();

  });


  it('connection test',  () => {
    expect(success).toBe(true);
  });
});