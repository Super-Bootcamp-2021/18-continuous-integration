const rc = require('rc');

const defaultConfig = {
  database: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'stratosfer10110100',
    database: 'sanbercode',
  },
  server: {
    task_port: 7002,
    worker_port: 7001,
    performance_port: 7003,
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
