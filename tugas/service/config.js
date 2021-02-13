const rc = require('rc');

const defaultConfig = {
  pg_database: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'database',
  },
  server: {
    port: 7767,
  },
};

const config = rc('tm', defaultConfig);

module.exports = {
  config,
};
