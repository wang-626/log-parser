const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485, CTR_CHANGE_ROOM_DATA } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { queryBuildingRoom } = require('./Data/dal/sql_hardware_init');
const { Room } = require('./Data/model/Room');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const meterId = parseInt(args.meter) || 1;
  const mode = args.mode != null ? parseInt(args.mode) : null;

  const allRoomRows = await queryBuildingRoom();
  const rooms = allRoomRows.filter(r => r.center_id === centerId).map(r => new Room(r)).sort((a, b) => a.id - b.id);

  if (rooms.length === 0) {
    const payload = { cmd: 'ChangeRoomSet', status: 'failed', centerId, meterId, reason: 'no rooms found' };
    broadcast(payload);
    throw new Error(`No rooms for center:${centerId}`);
  }

  const data = new Array(100).fill(0xFF);
  data[0] = 0x55;
  data[CTR_CHANGE_ROOM_DATA.CENTER_ID] = centerId;
  data[CTR_CHANGE_ROOM_DATA.CMD] = TOKEN_RS485.CTR_SET_ROOM_MODE;
  data[CTR_CHANGE_ROOM_DATA.SYSTEM_MODE] = 0;

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    if (room.center_id === centerId && room.meter_id === meterId) {
      const useMode = mode !== null ? mode : room.mode_220;
      data[4 + 4 * i] = useMode;
      data[5 + 4 * i] = useMode;
      data[6 + 4 * i] = Math.round(room.price_degree_220 * 10);
      data[7 + 4 * i] = Math.round(room.price_degree_110 * 10);
    }
  }
  data[98] = checksum(data);
  data[99] = 0x0A;

  broadcast({ new_log: [nowTime(), ...Array.from(data)] });
  const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_ACK]);
  if (result.success) {
    broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });
    const payload = { cmd: 'ChangeRoomSet', status: 'success', centerId, meterId, mode };
    broadcast(payload);
    return JSON.stringify(payload);
  } else {
    const payload = { cmd: 'ChangeRoomSet', status: 'failed', centerId, meterId, reason: result.reason };
    broadcast(payload);
    throw new Error(`ChangeRoomSet failed center:${centerId} reason:${result.reason}`);
  }
}

module.exports = { run };
