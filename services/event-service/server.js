const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || 'admin123',
  database: process.env.DB_NAME || 'db_294',
  port: process.env.DB_PORT || 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey294';
const PORT = process.env.PORT || 5002;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'exchange_294';

let channel = null;

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (err) {
    console.error('RabbitMQ connection failed, retrying in 5s...', err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}
connectRabbitMQ();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) return res.status(403).json({ error: 'No token provided' });
  
  const token = bearerHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Create Event Endpoint
app.post('/api/events', verifyToken, async (req, res) => {
  try {
    const { title, description, location } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    // Insert event
    const newEvent = await pool.query(
      'INSERT INTO events_294 (title, description, location, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, location, req.user.id]
    );

    const eventData = newEvent.rows[0];

    // Publish to RabbitMQ
    if (channel) {
      const message = JSON.stringify({
        eventType: 'EVENT_CREATED',
        data: eventData,
        creator: req.user.username,
        timestamp: new Date().toISOString()
      });
      channel.publish(EXCHANGE_NAME, 'event.created', Buffer.from(message));
      console.log('Published event to RabbitMQ');
    }

    res.status(201).json({ message: 'Event created', event: eventData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Events Endpoint
app.get('/api/events', verifyToken, async (req, res) => {
  try {
    const events = await pool.query('SELECT * FROM events_294 ORDER BY created_at DESC');
    res.json(events.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'event_service_294' });
});

app.listen(PORT, () => {
  console.log(`Event Service 294 running on port ${PORT}`);
});
