const rc = require('rc');

const defaultConfig = {
  database: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'sanbercode',
  },
  server: {
    workerPort: 7001,
    taskPort: 7002,
    performancePort: 7003,
  },
  minio: {
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
  },
};

const config = rc('tm', defaultConfig);

module.exports = {
  config,
};
