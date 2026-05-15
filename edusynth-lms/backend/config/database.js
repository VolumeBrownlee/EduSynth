// Database configuration
// This file exports database configuration options

const config = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/edusynth_dev',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    }
  },
  test: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/edusynth_test',
    options: {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    }
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    }
  }
};

const env = process.env.NODE_ENV || 'development';

module.exports = config[env];
