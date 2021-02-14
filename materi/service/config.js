const rc = require('rc');

const defaultConfig = {
  database: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgre',
    database: 'sanbercode2',
  },
  server: {
    port: 80,
  },
};

const config = rc('todo', defaultConfig);

module.exports = {
  config,
};
