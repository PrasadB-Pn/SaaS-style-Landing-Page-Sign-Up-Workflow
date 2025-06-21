const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const transporter = require('../utils/mailer');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    await User.create({ name, email, password: hashed });
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const url = `http://localhost:3000/auth/verify?token=${token}`;
    await transporter.sendMail({
      to: email,
      subject: 'Verify your email',
      html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`
    });
    res.send("Signup success. Check your email.");
  } catch (err) {
    res.status(500).send("Error signing up.");
  }
});

router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.updateOne({ email: decoded.email }, { isVerified: true });
    res.redirect('/dashboard.html');
  } catch (err) {
    res.status(400).send("Invalid or expired link.");
  }
});

module.exports = router;