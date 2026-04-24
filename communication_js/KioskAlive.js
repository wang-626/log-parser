const { kioskAlive } = require('./Data/model/DataConvertBytes');
const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485 } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const order = parseInt(args.order) || 0;
  const data = kioskAlive(order);
  data[98] = checksum(data);

  broadcast({ new_log: [nowTime(), ...Array.from(data)] });
  const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_KIOSK_ALIVE], 1);
  if (result.success) broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });
  const payload = result.success
    ? { cmd: 'KioskAlive', status: 'success', order }
    : { cmd: 'KioskAlive', status: 'failed', order, reason: result.reason };
  broadcast(payload);
  if (!result.success) throw new Error(`KioskAlive failed order:${order}`);
  return JSON.stringify(payload);
}

module.exports = { run };
