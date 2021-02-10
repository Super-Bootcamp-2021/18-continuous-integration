const { connect } = require('./lib/orm');
const { TodoSchema } = require('./todo.model');
const { config } = require('./config');
const server = require('./server');

/**
 * intiate database connection
 */
async function init() {
  try {
    console.log('connect to database');
    await connect([TodoSchema], config.database);
    console.log('database connected');
  } catch (err) {
    console.error('database connection failed');
    return;
  }
}

/**
 * main routine
 * @param {string} command launch command
 * @returns {Promise<void>}
 */
async function main() {
  await init();
  server.run();
}

main();
