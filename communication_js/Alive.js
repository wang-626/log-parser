const { alive } = require('./Data/model/DataConvertBytes');
const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485 } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const meterId = parseInt(args.meter) || 1;
  const openDoor = args.open === true || args.open === 'true';

  const room = openDoor ? { meter_id: meterId } : null;
  const data = alive(centerId, 0, room);
  data[98] = checksum(data);

  broadcast({ new_log: [nowTime(), ...Array.from(data)] });

  const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_SYSTEM_INFO]);
  if (result.success) {
    const resp = result.response;
    const payload = {
      cmd: 'Alive', status: 'success', centerId, meterId,
      numUnreadRecords: resp[18], readPoint: resp[19],
    };
    broadcast({ new_log: [nowTime(), ...Array.from(resp)] });
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'Alive', status: 'failed', centerId, meterId, reason: result.reason };
    console.log(data)
    throw new Error(`Alive failed: center:${centerId} reason:${result.reason}`);
  }
}

module.exports = { run };
