require("dotenv").config();
module.exports = {
  development: {
    username: process.env.DB_DEV_USER,
    password: process.env.DB_DEV_PASSWORD,
    database: process.env.DB_DEV_NAME,
    host: process.env.DB_DEV_HOST,
    port: process.env.DB_DEV_PORT,
    dialect: "postgres",
    logging: false,
  },
  test: {
    username: process.env.DB_TEST_USER,
    password: process.env.DB_TEST_PASSWORD,
    database: process.env.DB_TEST_NAME,
    host: process.env.DB_TEST_HOST,
    port: process.env.DB_TEST_PORT,
    dialect: "postgres",
    logging: false,
  },
  production: {
    use_env_variable: "DATABASE_URL", 
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  },
};
