const rc = require('rc');

const defaultConfig = {
  database: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'database',
  },
  minio: {
    endPoint: '127.0.0.1',
    port: 9000,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
  },
  server: {
    port: {
      worker: 80,
      task: 81,
      performance: 82,
    },
  },
};

const config = rc('server', defaultConfig);

module.exports = {
  config,
};
