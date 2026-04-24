const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485 } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55; data[1] = centerId; data[2] = TOKEN_RS485.CTR_GET_POWER_METER_110; data[4] = 1;
  data[91] = now.getFullYear() - 2000; data[92] = now.getMonth() + 1; data[93] = now.getDate();
  data[94] = now.getHours(); data[95] = now.getMinutes(); data[96] = now.getSeconds();
  data[97] = now.getDay() === 0 ? 7 : now.getDay();
  data[98] = checksum(data); data[99] = 0x0A;

  broadcast({ new_log: [nowTime(), ...Array.from(data)] });
  const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_POWER_METER_110]);
  if (result.success) {
    broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });
    const payload = { cmd: 'LayerRoomDegree110', status: 'success', centerId, response: Array.from(result.response) };
    broadcast(payload);
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'LayerRoomDegree110', status: 'failed', centerId, reason: result.reason };
    broadcast(payload);
    throw new Error(`LayerRoomDegree110 failed center:${centerId} reason:${result.reason}`);
  }
}

module.exports = { run };
