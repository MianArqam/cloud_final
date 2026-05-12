const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'exchange_294';
const QUEUE_NAME = 'queue_294';
const LOG_DIR = '/logs';
const LOG_FILE = path.join(LOG_DIR, 'lakehouse_logs_294.json');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

async function startConsumer() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'event.created');

    console.log(`Notification Service 294 waiting for messages in ${QUEUE_NAME}...`);

    channel.consume(QUEUE_NAME, (msg) => {
      if (msg !== null) {
        const payload = msg.content.toString();
        const eventData = JSON.parse(payload);

        // Simulated Notification output
        console.log('\n--- NEW NOTIFICATION ---');
        console.log(`[ALERT 294] User @${eventData.creator} created Event: "${eventData.data.title}" at ${eventData.data.location}`);
        console.log('------------------------\n');

        // Append to Lakehouse Log (JSONL format)
        fs.appendFileSync(LOG_FILE, payload + '\n');
        console.log(`[LOG 294] Event data appended to ${LOG_FILE}`);

        channel.ack(msg);
      }
    });

  } catch (err) {
    console.error('RabbitMQ connection failed, retrying in 5s...', err.message);
    setTimeout(startConsumer, 5000);
  }
}

startConsumer();
