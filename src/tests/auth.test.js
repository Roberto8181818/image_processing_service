const request = require("supertest");
const app = require("../app");
const { sequelize, User } = require("../models");


describe("Auth Endpoints", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("POST /auth/register", () => {
    it("debería registrar un usuario nuevo", async () => {
      const res = await request(app).post("/auth/register").send({
        username: "testuser",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("debería devolver error si el username ya está registrado", async () => {
      const res = await request(app).post("/auth/register").send({
        username: "testuser",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/username no disponible/i);
    });
  });

  describe("POST /auth/login", () => {
    it("debería loguear con credenciales correctas y devolver token", async () => {
      const res = await request(app).post("/auth/login").send({
        username: "testuser",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
    });

    it("debería devolver error si el usuario no existe", async () => {
      const res = await request(app).post("/auth/login").send({
        username: "noexiste@example.com",
        password: "whatever",
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid credentials/i);
    });

    it("debería rechazar si la contraseña es incorrecta", async () => {
      const res = await request(app).post("/auth/login").send({
        username: "testuser",
        password: "wrongpass",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid credentials/i);
    });
  });
});
