const { checksum, BidcardToStr, BbalanceToIntToFloat } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485 } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { broadcast, nowTime } = require('../websocket/ws');

function buildPacket(centerId, meterId, batchNumber) {
  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55;
  data[1] = centerId;
  data[2] = TOKEN_RS485.CTR_GET_USER_DATA;
  data[3] = meterId;
  data[4] = batchNumber;
  data[91] = now.getFullYear() - 2000;
  data[92] = now.getMonth() + 1;
  data[93] = now.getDate();
  data[94] = now.getHours();
  data[95] = now.getMinutes();
  data[96] = now.getSeconds();
  data[97] = now.getDay() === 0 ? 7 : now.getDay();
  data[98] = checksum(data);
  data[99] = 0x0A;
  return data;
}

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const meterId = parseInt(args.meter) || 1;
  let batchNumber = 0;
  const allUsers = [];

  while (true) {
    const data = buildPacket(centerId, meterId, batchNumber);
    broadcast({ new_log: [nowTime(), ...Array.from(data)] });
    const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_USER_DATA]);
    if (result.success) broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });

    if (!result.success) {
      const payload = { cmd: 'RoomInfo', status: 'failed', centerId, meterId, reason: result.reason };
      broadcast(payload);
      throw new Error(`RoomInfo failed: center:${centerId} meter:${meterId}`);
    }

    const resp = result.response;
    const memberIndex = resp[4];
    const memberCount = resp[10];
    let startIndex = 6;
    for (let i = 0; i < 5; i++) {
      const mode = resp[startIndex++];
      const idCard = BidcardToStr(Array.from(resp.slice(startIndex, startIndex + 4))); startIndex += 4;
      const balance = BbalanceToIntToFloat(Array.from(resp.slice(startIndex, startIndex + 4))); startIndex += 4;
      allUsers.push({ index: i, mode, id_card: idCard, balance });
    }

    if ((memberIndex + 1) * 6 < memberCount) { batchNumber++; } else { break; }
  }

  const payload = { cmd: 'RoomInfo', status: 'success', centerId, meterId, users: allUsers };
  broadcast(payload);
  return JSON.stringify(payload);
}

module.exports = { run };
