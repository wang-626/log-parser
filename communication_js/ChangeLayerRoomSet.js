const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485, CTR_CHANGE_ROOM_DATA, RoomMode } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { queryBuildingRoom } = require('./Data/dal/sql_hardware_init');
const { Room } = require('./Data/model/Room');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;

  const allRoomRows = await queryBuildingRoom();
  const rooms = allRoomRows.filter(r => r.center_id === centerId).map(r => new Room(r)).sort((a, b) => a.id - b.id);

  if (rooms.length === 0) {
    const payload = { cmd: 'ChangeLayerRoomSet', status: 'failed', centerId, reason: 'no rooms found' };
    broadcast(payload);
    throw new Error(`No rooms for center:${centerId}`);
  }

  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55;
  data[CTR_CHANGE_ROOM_DATA.CENTER_ID] = rooms[0].center_id;
  data[CTR_CHANGE_ROOM_DATA.CMD] = TOKEN_RS485.CTR_SET_ROOM_MODE;
  data[CTR_CHANGE_ROOM_DATA.SYSTEM_MODE] = 0;
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    if (room.mode_220 === RoomMode.BILLING_POWER_OFF) {
      data[4 + 4 * i] = room.isRoomUsing() ? 2 : 1;
      data[5 + 4 * i] = room.isRoomUsing() ? 2 : 1;
    } else {
      data[4 + 4 * i] = room.mode_110;
      data[5 + 4 * i] = room.mode_220;
    }
    data[6 + 4 * i] = Math.round(room.price_degree_110 * 10);
    data[7 + 4 * i] = Math.round(room.price_degree_220 * 10);
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

  broadcast({ new_log: [nowTime(), ...Array.from(data)] });
  const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_ACK]);
  if (result.success) {
    broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });
    const payload = { cmd: 'ChangeLayerRoomSet', status: 'success', centerId };
    broadcast(payload);
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'ChangeLayerRoomSet', status: 'failed', centerId, reason: result.reason };
    broadcast(payload);
    throw new Error(`ChangeLayerRoomSet failed center:${centerId} reason:${result.reason}`);
  }
}

module.exports = { run };
