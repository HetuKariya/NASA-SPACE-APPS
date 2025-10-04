// backend/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_demo';
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI)
  .then(()=> console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Simple API example
app.get('/api/ping', (req, res) => res.json({ msg: 'pong' }));

// Example Mongoose model (users)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res) => {
  try {
    const u = await User.create(req.body);
    res.status(201).json(u);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// In production you may serve the frontend build
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
