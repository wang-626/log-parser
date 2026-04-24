const { TOKEN_RS485, ROOM_INIT, LAYER_ROOM_RECORD } = require('./HardWareEnum');
const {
  studentIDToBytes, idCardToBytes, BbalanceToInt, checksum,
} = require('./HardWareCalculate');

function roomMember(idCard, studentId, balance, identity, powerstatus, canControlPower, canOpenDoor) {
  const data = new Array(13).fill(0);
  identity = identity < 2 ? identity : 0;
  const ps = (powerstatus === 1 && canControlPower === 1) ? 1 : 0;
  const ccp = canControlPower === 1 ? 0 : 1; // firmware: 0 = can control
  const cod = canOpenDoor === 1 ? 0 : 1;       // firmware: 0 = can open
  const mode = ps | (ccp << 5) | (cod << 6) | (identity << 7);
  data[0] = mode;
  let index = 1;
  for (const b of studentIDToBytes(studentId)) { data[index++] = b; }
  for (const b of idCardToBytes(idCard)) { data[index++] = b; }
  for (const b of BbalanceToInt(balance)) { data[index++] = b; }
  return data;
}

function roomInit(systemMode, room, members, packageIndex, roomFeeDeductors, mode110, mode220) {
  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55;
  data[ROOM_INIT.CENTER_ID] = room['center_id'];
  data[ROOM_INIT.CMD] = TOKEN_RS485.CTR_SET_ROOM_DATA;
  data[ROOM_INIT.METER_ID] = room['meter_id'];
  data[ROOM_INIT.PACKAGE_INDEX] = packageIndex;
  data[ROOM_INIT.SYSTEM_MODE] = systemMode;
  data[ROOM_INIT.ROOM_MODE110] = mode110;
  data[ROOM_INIT.ROOM_MODE220] = mode220;
  data[ROOM_INIT.ROOM_PRICE110] = Math.round(parseFloat(room['price_degree']) * 10);
  data[ROOM_INIT.ROOM_PRICE220] = Math.round(parseFloat(room['price_degree_220']) * 10);
  data[ROOM_INIT.MEMBER_COUNT] = members ? members.length : 0;

  let index = ROOM_INIT.ROOM_FEE_DEDUCTORS + 1; // = 12
  if (members) {
    const batch = members.slice(packageIndex * 6, packageIndex * 6 + 6);
    for (const member of batch) {
      const memberData = roomMember(
        member['id_card'], member['username'], member['balance'],
        member['identity'], member['powerstatus'], member['can_control_power'], member['can_open_door']
      );
      for (const b of memberData) { data[index++] = b; }
    }
  }
  data[ROOM_INIT.ROOM_FEE_DEDUCTORS] = roomFeeDeductors;
  data[91] = now.getFullYear() - 2000;
  data[92] = now.getMonth() + 1;
  data[93] = now.getDate();
  data[94] = now.getHours();
  data[95] = now.getMinutes();
  data[96] = now.getSeconds();
  data[97] = now.getDay() === 0 ? 7 : now.getDay();
  data[99] = 0x0A;
  return data;
}

function alive(centerId, previousRecordCount, room = null) {
  const data = new Array(100).fill(0);
  const now = new Date();
  data[0] = 0x55;
  data[LAYER_ROOM_RECORD.CMD] = TOKEN_RS485.CTR_ALIVE;
  data[LAYER_ROOM_RECORD.CENTER_ID] = centerId;
  data[LAYER_ROOM_RECORD.PREVIOUS_RECORD_COUNT] = previousRecordCount;
  data[LAYER_ROOM_RECORD.VERTIFY_RECORD_COUNT] = (255 - previousRecordCount) & 0xFF;
  if (room !== null) {
    data[LAYER_ROOM_RECORD.METER_ID] = room.meter_id;
    data[LAYER_ROOM_RECORD.CMD1] = 0x5A;
    data[LAYER_ROOM_RECORD.CMD2] = 0xA5;
  }
  data[91] = now.getFullYear() - 2000;
  data[92] = now.getMonth() + 1;
  data[93] = now.getDate();
  data[94] = now.getHours();
  data[95] = now.getMinutes();
  data[96] = now.getSeconds();
  data[97] = now.getDay() === 0 ? 7 : now.getDay();
  data[99] = 0x0A;
  return data;
}

function kioskAlive(order) {
  const data = new Array(100).fill(160);
  data[0] = 0x55;
  data[2] = TOKEN_RS485.CTR_KIOSK_ALIVE;
  data[3] = order;
  data[99] = 0x0A;
  return data;
}

function kioskAliveRsp() {
  const data = new Array(100).fill(160);
  data[0] = 0x55;
  data[2] = TOKEN_RS485.CTR_RSP_KIOSK_ALIVE;
  data[99] = 0x0A;
  data[98] = checksum(data);
  return data;
}

function kioskStop(order) {
  const data = new Array(100).fill(160);
  data[0] = 0x55;
  data[2] = TOKEN_RS485.CTR_KIOSK_STOP;
  data[3] = order;
  data[99] = 0x0A;
  return data;
}

function kioskStopRsp() {
  const data = new Array(100).fill(160);
  data[0] = 0x55;
  data[2] = TOKEN_RS485.CTR_RSP_KIOSK_STOP;
  data[99] = 0x0A;
  data[98] = checksum(data);
  return data;
}

function addTimestamp(data, startIdx = 91) {
  const now = new Date();
  data[startIdx] = now.getFullYear() - 2000;
  data[startIdx + 1] = now.getMonth() + 1;
  data[startIdx + 2] = now.getDate();
  data[startIdx + 3] = now.getHours();
  data[startIdx + 4] = now.getMinutes();
  data[startIdx + 5] = now.getSeconds();
  data[startIdx + 6] = now.getDay() === 0 ? 7 : now.getDay();
}

module.exports = {
  roomMember, roomInit, alive, kioskAlive, kioskAliveRsp,
  kioskStop, kioskStopRsp, addTimestamp,
};
