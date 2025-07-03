const amqp = require("amqplib");
const logger = require("./logger");
require("dotenv").config();

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
}
async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const eventData = JSON.parse(msg.content.toString());
      callback(eventData);
      channel.ack(msg);
      logger.info(`Event consumed from RabbitMQ: ${routingKey}`, eventData);
    }
  });
  logger.info(`Subscribed to events on routing key: ${routingKey}`);
}
async function publishEvent(routingKey, message) {
  try {
    if (!channel) {
      throw new Error(
        "Channel is not initialized. Call connectToRabbitMQ first."
      );
    }

    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(message));
    logger.info(`Event published to RabbitMQ: ${routingKey}`, message);
  } catch (error) {
    logger.error("Error publishing event to RabbitMQ:", error);
    throw error;
  }
}

async function publishToQueue(message) {
  try {
    await channel.assertQueue(process.env.RABBITMQ_QUEUE, { durable: false });
    channel.sendToQueue(process.env.RABBITMQ_QUEUE, Buffer.from(message));
    logger.info("Message sent to RabbitMQ:", message);
  } catch (error) {
    logger.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
}
module.exports = {
  connectToRabbitMQ,
  publishToQueue,
  publishEvent,
  consumeEvent,
};
