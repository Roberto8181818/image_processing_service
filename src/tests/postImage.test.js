const request = require("supertest");
const app = require("../app");
const { sequelize, Image, User } = require("../models");

jest.mock("../services/storageService", () => {
  const fs = require("fs");
  const path = require("path");
  const testImagePath = path.join(__dirname, "assets/testImage.jpg");

  return {
    uploadBuffer: jest.fn(async (key, buffer, mimetype) => {
      return `http://mockstorage.com/${key}`;
    }),
    getFileBuffer: jest.fn(async (key) => {
      return fs.readFileSync(testImagePath);
    }),
  };
});

let token;
let testUser;
let testImage;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  testUser = await User.create({ username: "test", password: "123456" });
  token = "Bearer " + testUser.generateToken();

  testImage = await Image.create({
    user_id: testUser.id,
    filename: "test_img.jpg",
    path: "/test/img",
    url: "http://test.com/image.jpg",
    metadata: { width: 800, height: 600 },
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe("POST /image/", () => {
  it("debería subir una imagen y crear thumbnail", async () => {
    const res = await request(app)
      .post("/image")
      .set("Authorization", token)
      .attach("image", require("path").join(__dirname, "assets/testImage.jpg"));

    expect(res.status).toBe(201);
    expect(res.body.image).toBeDefined();
    expect(res.body.thumbnail).toBeDefined();
  });

  it("debería devolver 400 si no se envía archivo", async () => {
    const res = await request(app).post("/image").set("Authorization", token);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No se recibió ninguna imagen");
  });
});

describe("POST /image/:id/transform", () => {
  it("debería aplicar una transformación (resize)", async () => {
    const res = await request(app)
      .post(`/image/${testImage.id}/transform`)
      .set("Authorization", token)
      .send({
        resize: { width: 300, height: 200 },
        format: "jpeg",
      });

    expect(res.status).toBe(200);
    expect(res.body.transformation).toBeDefined();
    expect(res.body.url).toMatch(/http:\/\/mockstorage\.com/);
  });

  it("debería devolver 404 si la imagen no existe", async () => {
    const res = await request(app)
      .post(`/image/9999/transform`)
      .set("Authorization", token)
      .send({ resize: { width: 100, height: 100 } });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Imagen no encontrada");
  });
});
