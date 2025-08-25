const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const R2 = require("../config/r2");

const BUCKET = process.env.R2_BUCKET_NAME;
const ACCOUNT = process.env.R2_ACCOUNT_ID;

const getPublicUrl = (key) => {
    return `https://pub-e24908244420489f9b1278a2e9957147.r2.dev/${key}`;
};

const uploadBuffer = async (key, buffer, contentType = "application/octet-stream") => {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await R2.send(cmd);
  return getPublicUrl(key);
};

const uploadFile = async (key, filePath, contentType = "application/octet-stream") => {
  const stream = fs.createReadStream(filePath);
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: stream,
    ContentType: contentType,
  });
  await R2.send(cmd);
  return getPublicUrl(key);
};

const getFileBuffer = async (key) => {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const res = await R2.send(cmd);
  const chunks = [];
  for await (const c of res.Body) chunks.push(c);
  return Buffer.concat(chunks);
};

const deleteObject = async (key) => {
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await R2.send(cmd);
  return true;
};

module.exports = {
  uploadBuffer,
  uploadFile,
  getFileBuffer,
  deleteObject,
  getPublicUrl,
};
