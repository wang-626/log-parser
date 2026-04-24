const { BbalanceToInt, checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485, CTR_CHANGE_USER_DATA } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { querySingleRoom } = require('./Data/dal/sql_hardware_init');
const { queryRoomForMember } = require('./Data/dal/sql_commonlyUsed');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const meterId = parseInt(args.meter) || 1;

  const rooms = await querySingleRoom(centerId, meterId);
  if (!rooms || rooms.length === 0) {
    const payload = { cmd: 'ChangeMemberInfo', status: 'failed', centerId, meterId, reason: 'room not found' };
    broadcast(payload);
    throw new Error(`Room not found: center=${centerId} meter=${meterId}`);
  }
  const room = rooms[0];
  const members = await queryRoomForMember(room.id) || [];
  if (members.length === 0) {
    const payload = { cmd: 'ChangeMemberInfo', status: 'failed', centerId, meterId, reason: 'no members' };
    broadcast(payload);
    throw new Error(`No members in room ${room.id}`);
  }

  const member = members[0];
  const chargeCount = members.filter(m => m.powerstatus === 1 && m.can_control_power === 1).length;

  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55;
  data[CTR_CHANGE_USER_DATA.CENTER_ID] = centerId;
  data[CTR_CHANGE_USER_DATA.CMD] = TOKEN_RS485.CTR_CHANGE_USER_DATA;
  data[CTR_CHANGE_USER_DATA.CHANGE_COUNT] = 1;
  const idx = CTR_CHANGE_USER_DATA.CHANGE_COUNT + 1;
  data[idx] = room.meter_id;
  data[idx + 1] = chargeCount;
  data[idx + 2] = member.index || 0;
  data[idx + 3] = member.powerstatus;
  const bbal = BbalanceToInt(parseFloat(member.balance));
  data[idx + 4] = bbal[0]; data[idx + 5] = bbal[1]; data[idx + 6] = bbal[2]; data[idx + 7] = bbal[3];
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
    const payload = { cmd: 'ChangeMemberInfo', status: 'success', centerId, meterId, memberId: member.id };
    broadcast(payload);
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'ChangeMemberInfo', status: 'failed', centerId, meterId, memberId: member.id, reason: result.reason };
    broadcast(payload);
    throw new Error(`ChangeMemberInfo failed reason:${result.reason}`);
  }
}

module.exports = { run };
