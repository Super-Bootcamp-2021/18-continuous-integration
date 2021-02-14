const { getConnection } = require('typeorm');
const { Worker } = require('./worker.model');
const bus = require('../lib/bus');

const ERROR_REGISTER_DATA_INVALID = 'data registrasi pekerja tidak lengkap';
const ERROR_WORKER_NOT_FOUND = 'pekerja tidak ditemukan';

async function register(data) {
  if (!data.name || !data.age || !data.bio || !data.address || !data.photo) {
    throw ERROR_REGISTER_DATA_INVALID;
  }
  const workerRepo = getConnection().getRepository('Worker');
  const worker = new Worker(
    null,
    data.name,
    parseInt(data.age, 10),
    data.bio,
    data.address,
    data.photo
  );
  await workerRepo.save(worker);
  bus.publish('worker.registered', worker);
  return worker;
}

function list() {
  const workerRepo = getConnection().getRepository('Worker');
  return workerRepo.find();
}

async function info(id) {
  const workerRepo = getConnection().getRepository('Worker');
  const worker = await workerRepo.findOne(id);
  if (!worker) {
    throw ERROR_WORKER_NOT_FOUND;
  }
  return worker;
}

async function remove(id) {
  const workerRepo = getConnection().getRepository('Worker');
  const worker = await workerRepo.findOne(id);
  if (!worker) {
    throw ERROR_WORKER_NOT_FOUND;
  }
  await workerRepo.delete(id);
  bus.publish('worker.removed', worker);
  return worker;
}

/**
 * truncate database
 * @returns {Promise<boolean>} boolean
 */
async function truncate() {
  const entities = getConnection().entityMetadatas;

  for (const entity of entities) {
    const repository = await getConnection().getRepository(entity.name); // Get repository
    try {
      // change clear to delete for reference table issue

      await repository.delete({}); // Clear each entity table's content
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  return true;
}

module.exports = {
  register,
  list,
  remove,
  info,
  truncate,
  ERROR_REGISTER_DATA_INVALID,
  ERROR_WORKER_NOT_FOUND,
};
