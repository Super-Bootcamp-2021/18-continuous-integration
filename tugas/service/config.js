const rc = require('rc');

const defaultConfig = {
  pg: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '1234567890',
    database: 'sanbercode2',
  },
  minio: {
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
  },
  nats: {
    port: 4222,
  },
  server: {
    taskPort: 7002,
    workerPort: 7001,
  },
};

const config = rc('tm', defaultConfig);

module.exports = {
  config,
};