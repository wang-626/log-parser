const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485, CTR_SET_SYSTEM_HW } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const cmd = parseInt(args.c) || 0;
  const cmdArg = parseInt(args.a) || 0;

  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55;
  data[CTR_SET_SYSTEM_HW.CENTER_ID] = centerId;
  data[CTR_SET_SYSTEM_HW.CMD] = TOKEN_RS485.CTR_SET_SYSTEM_HW;
  data[CTR_SET_SYSTEM_HW.METER_ID] = centerId;
  data[CTR_SET_SYSTEM_HW.SYSTEM_CMD] = cmd;
  data[CTR_SET_SYSTEM_HW.SYSTEM_CMD + 1] = (255 - cmd) & 0xFF;
  data[CTR_SET_SYSTEM_HW.SYSTEM_ARG] = cmdArg;
  data[91] = now.getFullYear() - 2000;
  data[92] = now.getMonth() + 1;
  data[93] = now.getDate();
  data[94] = now.getHours();
  data[95] = now.getMinutes();
  data[96] = now.getSeconds();
  data[97] = now.getDay() === 0 ? 7 : now.getDay();
  data[98] = checksum(data);
  data[99] = 0x0A;

  broadcast({ new_log: [nowTime(), ...Array.from(data)] });
  const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_ACK]);
  if (result.success) {
    broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });
    const payload = { cmd: 'SetHardware', status: 'success', centerId, hardwareCmd: cmd, arg: cmdArg };
    broadcast(payload);
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'SetHardware', status: 'failed', centerId, hardwareCmd: cmd, arg: cmdArg, reason: result.reason };
    broadcast(payload);
    throw new Error(`SetHardware failed center:${centerId} reason:${result.reason}`);
  }
}

module.exports = { run };
