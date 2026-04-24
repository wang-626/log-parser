require('dotenv').config();
const { SerialPort } = require('serialport');

const DEFAULT_PACKET_SIZE = 100;
const READ_TIMEOUT_MS = 1000;

/**
 * Open a serial port and return the port instance.
 */
async function openPort(options = {}) {
  const port = new SerialPort({
    path: process.env.COM_PORT || 'COM8',
    baudRate: parseInt(process.env.BAUD_RATE) || 57600,
    parity: 'none',
    stopBits: 1,
    dataBits: 8,
    autoOpen: false,
    ...options,
  });

  await new Promise((resolve, reject) => {
    port.open((err) => err ? reject(err) : resolve());
  });
  return port;
}

/**
 * Write data and wait for a response packet of expectedLength bytes.
 * Returns Buffer or null on timeout.
 */
function writeAndRead(port, data, expectedLength = DEFAULT_PACKET_SIZE, timeoutMs = READ_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let buffer = Buffer.alloc(0);

    const timer = setTimeout(() => {
      port.removeListener('data', onData);
      resolve(null);
    }, timeoutMs);

    function onData(chunk) {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length >= expectedLength) {
        clearTimeout(timer);
        port.removeListener('data', onData);
        resolve(buffer.slice(0, expectedLength));
      }
    }

    port.on('data', onData);
    port.write(Buffer.from(data), (err) => {
      if (err) {
        clearTimeout(timer);
        port.removeListener('data', onData);
        resolve(null);
      }
    });
  });
}

/**
 * Execute a single serial transaction: send data, wait for expected token response.
 * Returns { success: bool, response: Buffer|null }
 */
function flushPort(port) {
  return new Promise((res) => {
    const t = setTimeout(res, 500);
    port.flush(() => { clearTimeout(t); res(); });
  });
}

function closePort(port) {
  return new Promise((res) => {
    const t = setTimeout(res, 2000);
    port.close(() => { clearTimeout(t); res(); });
  });
}

async function executeTransaction(data, _expectedTokens, maxRetries = 3, timeoutMs = READ_TIMEOUT_MS) {
  const port = await openPort();

  try {
    await flushPort(port);

    let response = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      response = await writeAndRead(port, data, DEFAULT_PACKET_SIZE, timeoutMs);

      if (response) {
        return { success: true, response };
      }
    }
    return { success: false, response, reason: 'timeout' };
  } finally {
    await closePort(port);
  }
}

/**
 * Execute a smaller packet (e.g. 56 bytes for LayerRoomMode).
 */
async function executeSmallTransaction(data, _expectedTokens, packetSize = 56, maxRetries = 3, timeoutMs = READ_TIMEOUT_MS) {
  const port = await openPort();
  try {
    await flushPort(port);
    let response = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      response = await writeAndRead(port, data, packetSize, timeoutMs);
      if (response) {
        return { success: true, response };
      }
    }
    return { success: false, response, reason: 'timeout' };
  } finally {
    await closePort(port);
  }
}

module.exports = { openPort, writeAndRead, executeTransaction, executeSmallTransaction };
