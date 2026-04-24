const { BbalanceToInt, checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485, CTR_CHANGE_USER_DATA } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { queryBuildingRoom, queryRoomMembers } = require('./Data/dal/sql_hardware_init');
const { Room } = require('./Data/model/Room');
const { User } = require('./Data/model/User');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;

  const allRoomRows = await queryBuildingRoom();
  const centerRooms = allRoomRows.filter(r => r.center_id === centerId).map(r => new Room(r));

  for (const room of centerRooms) {
    const members = await queryRoomMembers(room.id);
    room.Users = members.map(m => new User(m));
  }

  const roomsWithMembers = centerRooms.filter(r => r.Users.length > 0);
  if (roomsWithMembers.length === 0) {
    console.log(`ChangeLayerMemberInfo: no members in center:${centerId}`);
    return JSON.stringify({ status: 'no members' });
  }

  let memberCount = 0;
  for (const room of roomsWithMembers) memberCount += room.Users.length;

  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55;
  data[CTR_CHANGE_USER_DATA.CENTER_ID] = centerId;
  data[CTR_CHANGE_USER_DATA.CMD] = TOKEN_RS485.CTR_CHANGE_USER_DATA;
  data[CTR_CHANGE_USER_DATA.CHANGE_COUNT] = memberCount;

  let index = CTR_CHANGE_USER_DATA.CHANGE_COUNT + 1;
  for (const room of roomsWithMembers) {
    for (const member of room.Users) {
      data[index] = room.meter_id;
      data[index + 1] = room.getUserIsUsingCount();
      data[index + 2] = member.index;
      data[index + 3] = member.getMode();
      const bbal = BbalanceToInt(member.balance);
      data[index + 4] = bbal[0];
      data[index + 5] = bbal[1];
      data[index + 6] = bbal[2];
      data[index + 7] = bbal[3];
      index += 8;
    }
  }

  data[91] = now.getFullYear() - 2000;
  data[92] = now.getMonth() + 1;
  data[93] = now.getDate();
  data[94] = now.getHours();
  data[95] = now.getMinutes();
  data[96] = now.getSeconds();
  data[97] = now.getDay() === 0 ? 7 : now.getDay();
  data[98] = checksum(data);
  data[99] = 0x0A;

  console.log(`ChangeLayerMemberInfo → center:${centerId} memberCount:${memberCount}`);
  broadcast({ new_log: [nowTime(), ...Array.from(data)] });
  const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_ACK]);
  if (result.success) {
    broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });
    const payload = { cmd: 'ChangeLayerMemberInfo', status: 'success', centerId, memberCount };
    broadcast(payload);
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'ChangeLayerMemberInfo', status: 'failed', centerId, reason: result.reason };
    broadcast(payload);
    const msg = `ChangeLayerMemberInfo failed center:${centerId} reason:${result.reason}`;
    console.error(msg);
    throw new Error(msg);
  }
}

module.exports = { run };
