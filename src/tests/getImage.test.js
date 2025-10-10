const request = require("supertest");
const app = require("../app");
const { sequelize, Image, Transformation, User } = require("../models");

let token;
let testImage;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const testUser = await User.create({ username: "test", password: "123456" });
  token = "Bearer " + testUser.generateToken();

  testImage = await Image.create({
    user_id: testUser.id,
    filename: "img de prueba",
    path: "/test/img",
    url: "http://test.com/image.jpg",
    metadata: { width: 800, height: 600 },
  });

  testImage2 = await Image.create({
    user_id: testUser.id,
    filename: "img de prueba",
    path: "/test/img",
    url: "http://test.com/image222.jpg",
    metadata: { width: 850, height: 650 },
  });

  await Transformation.create({
    image_id: testImage.id,
    filename: "resize_mock.png",
    path: "/mock/path/resize_mock.png",
    url: "http://mockstorage.com/resize_mock.png",
    params: JSON.stringify({ width: 400, height: 300 }),
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe("GET /image/ ", () => {
  it("debería devolver la imagen sin transformaciones por defecto", async () => {
    const res = await request(app)
      .get(`/image/${testImage.id}`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.image_id).toBe(testImage.id);
    expect(res.body.data.transformations).toBeUndefined();
  });

  it("debería devolver la imagen con transformaciones si includeTransformations=true", async () => {
    const res = await request(app)
      .get(`/image/${testImage.id}?includeTransformations=true`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transformations).toBeDefined();
    expect(res.body.data.transformations.length).toBeGreaterThan(0);
  });

  it("debería devolver la lista de imágenes", async () => {
    const res = await request(app).get("/image").set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("debería devolver la lista de imágenes con transformaciones si includeTransformations=true", async () => {
    const res = await request(app)
      .get("/image?includeTransformations=true")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    res.body.data.forEach((img) => {
      expect(img.transformations).toBeDefined();
    });
  });

  it("debería devolver 404 si la imagen no existe", async () => {
    const res = await request(app)
      .get(`/image/9999`)
      .set("Authorization", token);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Imagen no encontrada");
  });
});
