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
  objectStorage: {
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'admin',
    secretKey: 'password',
  },
  server: {
    portWorker: 7001,
    portTask: 7002,
    portPerformance: 7003,
  },
};

const config = rc('tm', defaultConfig);

module.exports = {
  config,
};
