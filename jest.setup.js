const { sequelize } = require("./src/models");

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos de test");
  } catch (err) {
    console.error("Error al conectar BD en test:", err);
    throw err;
  }
});

afterAll(async () => {
  await sequelize.close();
});
