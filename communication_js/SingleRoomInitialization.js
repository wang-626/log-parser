const { roomInit } = require('./Data/model/DataConvertBytes');
const { checksum } = require('./Data/model/HardWareCalculate');
const { TOKEN_RS485, RoomMode } = require('./Data/model/HardWareEnum');
const { executeTransaction } = require('./SerialDataHandler');
const { queryRoomForMember } = require('./Data/dal/sql_commonlyUsed');
const { querySingleRoom } = require('./Data/dal/sql_hardware_init');
const { broadcast, nowTime } = require('../websocket/ws');

async function run(args) {
  const centerId = parseInt(args.center) || 1;
  const meterId = parseInt(args.meter) || 1;

  const rooms = await querySingleRoom(centerId, meterId);
  if (!rooms || rooms.length === 0) {
    const payload = { cmd: 'SingleRoomInitialization', status: 'failed', centerId, meterId, reason: 'room not found' };
    broadcast(payload);
    throw new Error(`Room not found: center=${centerId} meter=${meterId}`);
  }
  const room = rooms[0];
  const members = await queryRoomForMember(room.id) || [];
  const systemMode = room.system_mode || 0;
  let mode110 = room.mode;
  let mode220 = room.mode_220;
  const roomFeeDeductors = members.filter(m => m.powerstatus === 1 && m.can_control_power === 1).length;
  if (mode220 === RoomMode.BILLING_POWER_OFF) {
    mode110 = roomFeeDeductors > 0 ? RoomMode.BILLING_POWER_ON : RoomMode.BILLING_POWER_OFF;
    mode220 = roomFeeDeductors > 0 ? RoomMode.BILLING_POWER_ON : RoomMode.BILLING_POWER_OFF;
  }

  const totalBatches = Math.ceil((members.length || 1) / 6);
  for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
    const data = roomInit(systemMode, room, members, batchNumber, roomFeeDeductors, mode110, mode220);
    data[98] = checksum(data);
    broadcast({ new_log: [nowTime(), ...Array.from(data)] });
    const result = await executeTransaction(data, [TOKEN_RS485.CTR_RSP_ACK]);
    if (result.success) broadcast({ new_log: [nowTime(), ...Array.from(result.response)] });
    if (!result.success) {
      const payload = { cmd: 'SingleRoomInitialization', status: 'failed', centerId, meterId, roomId: room.id, reason: result.reason };
      broadcast(payload);
      throw new Error(`SingleRoomInitialization failed room:${room.id} batch:${batchNumber}`);
    }
  }

  const payload = { cmd: 'SingleRoomInitialization', status: 'success', centerId, meterId, roomId: room.id };
  broadcast(payload);
  return JSON.stringify(payload);
}

module.exports = { run };
