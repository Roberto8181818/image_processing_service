const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports.register = async (req, res) => {
  const { username, password } = req.body;

  const isUser = await User.findOne({ where: { username } });

  if (isUser) {
    return res
      .status(400)
      .json({ success: false, error: "username no disponible" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password_hash: hashed });

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET
  );
  res.status(201);
  res.json({ success: true, data: token });
};

module.exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });

  if (!user) {
    return res
      .status(404)
      .json({ success: false, error: "Invalid credentials" });
  }

  if (!(await bcrypt.compare(password, user.password_hash))) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET
  );

  res.status(200).json({ success: true, token });
};
