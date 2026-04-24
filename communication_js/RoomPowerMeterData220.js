const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485 } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const meterId = parseInt(args.meter) || 1;
  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55; data[1] = centerId; data[2] = TOKEN_RS485.CTR_GET_POWER_METER_DATA_220; data[3] = meterId;
  data[91] = now.getFullYear() - 2000; data[92] = now.getMonth() + 1; data[93] = now.getDate();
  data[94] = now.getHours(); data[95] = now.getMinutes(); data[96] = now.getSeconds();
  data[97] = now.getDay() === 0 ? 7 : now.getDay();
  data[98] = checksum(data); data[99] = 0x0A;

  broadcast({ new_log: [nowTime(), ...Array.from(data)] });
  const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_POWER_METER_DATA_220]);
  if (result.success) {
    broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });
    const payload = { cmd: 'RoomPowerMeterData220', status: 'success', centerId, meterId, response: Array.from(result.response) };
    broadcast(payload);
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'RoomPowerMeterData220', status: 'failed', centerId, meterId, reason: result.reason };
    broadcast(payload);
    throw new Error(`RoomPowerMeterData220 failed center:${centerId} meter:${meterId} reason:${result.reason}`);
  }
}

module.exports = { run };
