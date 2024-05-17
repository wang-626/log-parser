const byte2Name = {
  16: '確認系統Alive',
  17: '房間初始化',
  18: 'SET房間模式費率',
  19: '改變USER資料',
  20: 'GET電表度數220',
  21: 'GET單個電表資訊220',
  22: 'GET USER DATA',
  23: '硬體控制(CTR_SET_SYSTEM_HW)',
  //上面傳送下面回應
  48: 'RSP ACK',
  49: 'CTR_RSP_SYSTEM_INFO',
  50: 'RSP 讀取所有房間電表度數',
  51: 'RSP 單個電表詳細資料',
  52: 'RSP 重新RESET',
  53: 'RSP USER DATA',
}


const byteName = {
  0: { name: '時間' },
  1: { name: 'CenterID' },
  2: { name: 'mode', selectName: byte2Name },
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  19: 19,
  20: 20,
  21: 21,
  22: 22,
  23: 23,
  24: 24,
  25: 25,
  26: 26,
  27: 27,
  28: 28,
  29: 29,
  30: 30,
  31: 31,
  32: 32,
  33: 33,
  34: 34,
  35: 35,
  36: 36,
  37: 37,
  38: 38,
  39: 39,
  40: 40,
  41: 41,
  42: 42,
  43: 43,
  44: 44,
  45: 45,
  46: 46,
  47: 47,
  48: 48,
  49: 49,
  50: 50,
  51: 51,
  52: 52,
  53: 53,
  54: 54,
  55: 55,
  56: 56,
}

const roomModeHash = {
  1: '計費關電',
  2: '計費開電',
  3: '免費',
  4: '停用',
  'error': (byte) => { return `<p class="m-0 text-danger">錯誤參數 : ${String(byte)}</p>` }
}

const userModeHash = {
  0: '關閉',
  1: '送電',
}

const systemHash = {
  0: '單人',
  1: '多人',
  2: '負值',
  255: '不變',
  'error': (byte) => { return `<p class="m-0 text-danger">錯誤參數 : ${String(byte)}</p>` }
}

const alive = {
  readCount: 5,
  packageIndex: 4,
  room_id:7,
  cmd1: 8,
  cmd2: 9,
}


const roomInit = {
  meterId: 3,
  packageIndex: 4,
  systemMode: 5,
  roomMode220: 6,
  roomMode110: 7,
  roomPrice220: 8,
  roomPrice110: 9,
  memberCount: 10,
  roomFeeDeductors: 11,
}

const ctrRsp = {
  cmd: 2,
  roomStatus: 3,
  roomMode220: 26,
  roomMode110: 49,
}

const ctrRspSystemInfo = {
  cmd: 2,
  readerError: 3,
  powerMeter220Error: 6,
  powerMeter110Error: 9,
  meterError: 12,
  meterRelayError: 15,
  newRecordCounter: 18,
  recordReadPoint: 19,
}

const ctrRspPowerData = {
  meterId: 3,
  totalPower: 4,
  meterValtage: 8,
  meterCurrent: 12,
  meterVA: 16,
  meterActPower: 20,
  meterFreq: 24,
}

const ctrChangeRoomData = {
  cmd: 2,
  systemMode: 3,
}

const ctrChangeUserData = {
  setCount: 3,
}

const ctrSetSystemHw = {
  systemCmd: 3,
  systemArg: 6,
}


const maxRoom = 22
const dateLen = 102