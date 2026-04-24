const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485 } = require('./Data/model/HardWareEnum');
const { executeSmallTransaction } = require('./SerialDataHandler');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const PACKET_SIZE = 56;
  const data = new Array(PACKET_SIZE).fill(0);
  const now = new Date();
  data[0] = 0x55; data[1] = centerId; data[2] = TOKEN_RS485.CTR_GET_ALL_ROOM_MODE; data[4] = 1;
  data[47] = now.getFullYear() - 2000; data[48] = now.getMonth() + 1; data[49] = now.getDate();
  data[50] = now.getHours(); data[51] = now.getMinutes(); data[52] = now.getSeconds();
  data[53] = now.getDay() === 0 ? 7 : now.getDay();
  data[54] = checksum(data); data[55] = 0x0A;

  broadcast({ new_log: [nowTime(), ...Array.from(data)] });
  const result = await executeSmallTransaction(data, [TOKEN_RS485.CTR_RSP_ALL_ROOM_MODE], PACKET_SIZE);
  if (result.success) {
    const resp = result.response;
    broadcast({ new_log: [nowTime(), ...Array.from(resp)] });
    const rooms = [];
    let idx = 5;
    for (let i = 0; i < 6; i++) {
      const mode220 = resp[idx] === 2 ? 1 : resp[idx]; idx++;
      const mode110 = resp[idx] === 2 ? 1 : resp[idx]; idx++;
      rooms.push({ meter_id: i + 1, mode220, mode110 });
    }
    const payload = { cmd: 'LayerRoomMode', status: 'success', centerId, rooms };
    broadcast(payload);
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'LayerRoomMode', status: 'failed', centerId, reason: result.reason };
    broadcast(payload);
    throw new Error(`LayerRoomMode failed center:${centerId} reason:${result.reason}`);
  }
}

module.exports = { run };
