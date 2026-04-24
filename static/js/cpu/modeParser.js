const byteToBitStr = (byte) => {
  return Number(byte).toString(2).padStart(8, '0').replace(/(.{4})(.{4})/, "$1 $2")
}

function getRoomMode(byte) {
  if (byte in roomModeHash) {
    return roomModeHash[byte];
  } else {
    return roomModeHash['error'](byte);
  }
}


class ModeParser {
  constructor(textList) {
    this.textList = textList;
    this.bytes = textList.slice(2)
  }
  /**
   * 固定資訊
   * @param {string} html 開頭的資訊擴充
   */
  titleHtml(html = '') {
    const byte1Dec = parseInt(this.bytes[1], 10);
    const byte2Dec = parseInt(this.bytes[2], 10);
    const modeName = byte2Name[byte2Dec] || byte2Dec
    return `<div class="m-3"><p>模式 : ${modeName}<br></p><p>Center ID : ${byte1Dec}${html}</p></div>`
  }

  /**
  * @param {array} list 時間陣列
  * @param {string} thead table表頭(預設已經有時間單位)
  * - list欄位意思
  * - 0 年
  * - 1 月
  * - 2 日
  * - 3 小時
  * - 4 分鐘
  * - 5 秒
 */
  time(list, thead = '') {
    let html = `<table class="table table-success table-striped mx-3 align-self-start"><thead>
    ${thead}
    <tr><th>年</th><th>月</th><th>日</th><th>小時</th><th>分鐘</th><th>秒</th></tr></thead><tbody>`
    const yesr = String(parseInt(list[0], 10)).padStart(2, '0')
    const month = String(parseInt(list[1], 10)).padStart(2, '0')
    const day = String(parseInt(list[2], 10)).padStart(2, '0')
    const hour = String(parseInt(list[3], 10)).padStart(2, '0')
    const minute = String(parseInt(list[4], 10)).padStart(2, '0')
    const second = String(parseInt(list[5], 10)).padStart(2, '0')
    html += `<tr><td>${yesr}</td><td>${month}</td><td>${day}</td><td>${hour}</td><td>${minute}</td><td>${second}</td></tr>`
    html += `<tbody></table>`
    return html
  }


  Bnum_to_dec(Bdegree) {
    let degree = 0
    degree = Number(Bdegree[0]) << 24
    degree += Number(Bdegree[1]) << 16
    degree += Number(Bdegree[2]) << 8
    degree += Number(Bdegree[3])
    if (degree !== 0) {
      return degree / 100.0
    }
    return 0
  }

  /**
   * 固定資訊
   * @param {Array} BIdCard 陣列4個
   */
  Bidcard_to_str(BIdCard) {
    let idCard = 0
    idCard = idCard | Number(BIdCard[0]) << 24
    idCard = idCard | Number(BIdCard[1]) << 16
    idCard = idCard | Number(BIdCard[2]) << 8
    idCard = idCard | Number(BIdCard[3])
    return String(idCard).padStart(10, '0')
  }

  DecimalNumber(hexArray) {
    return hexArray.reduce((acc, curr) => {
      return (acc << 8n) + BigInt(parseInt(curr, 10));
    }, 0n);
  }

  /**
   * 固定資訊
   * @param {Array} BIdCard 陣列4個
   */
  Bstudent_id_to_str(BstudentId) {
    let studentId = ""
    studentId += String.fromCharCode(BstudentId[0])
    studentId += String.fromCharCode(BstudentId[1])
    studentId += String.fromCharCode(BstudentId[2])
    studentId += String.fromCharCode(BstudentId[3])
    return studentId
  }

  /**
   * 固定資訊
   * @param {Array} Bbalance 陣列4個
   */
  Bbalance_to_str(Bbalance) {
    let bytes = new Uint8Array(Bbalance)

    // 使用 DataView 對字節數組進行解析並轉換為浮點數
    let dataView = new DataView(bytes.buffer);
    let float = dataView.getFloat32(0, true)

    return float.toFixed(2);
  }


  price_format(price) {
    if (price === 255 || price === '255') {
      return '不變'
    }
    return parseInt(price, 10) / 10.0
  }
}


/**
 * Alive進出紀錄
 */
class AliveParser extends ModeParser {

  roomInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>memter ID</th><th>電表模式</th><th>Byte</th></tr><tbody>`
    let curr = alive.cmdCheck + 1
    for (let i = 0; i < 8; i++) {
      const mode = parseInt(this.bytes[curr+i], 10)
      const modeByte = curr + i
      html += `<tr><td>${i + 1}</td><td>${mode}</td><td>${modeByte}</td></tr>`
    }
    html += `<tbody></table>`
  
    html += `<div class="ms-3"><table class="table table-success table-striped">
    <thead><tr><th>memter ID</th><th>電表模式</th><th>Byte</th></tr><tbody>`
    for (let i = 8; i < 16; i++) {
      const mode = parseInt(this.bytes[curr+i], 10)
      const modeByte = curr + i
      html += `<tr><td>${i + 1}</td><td>${mode}</td><td>${modeByte}</td></tr>`
    }
    html += `<tbody></table></div>`

    html += `<div class="ms-3"><table class="table table-success table-striped">
    <thead><tr><th>memter ID</th><th>電表模式</th><th>Byte</th></tr><tbody>`
    for (let i = 16; i < 24; i++) {
      const mode = parseInt(this.bytes[curr+i], 10)
      const modeByte = curr + i
      html += `<tr><td>${i + 1}</td><td>${mode}</td><td>${modeByte}</td></tr>`
    }
    html += `<tbody></table></div>`

    html += `<div class="ms-3"><table class="table table-success table-striped">
    <thead><tr><th>memter ID</th><th>電表模式</th><th>Byte</th></tr><tbody>`
    for (let i = 24; i < 32; i++) {
      const mode = parseInt(this.bytes[curr+i], 10)
      const modeByte = curr + i
      html += `<tr><td>${i + 1}</td><td>${mode}</td><td>${modeByte}</td></tr>`
    }
    html += `<tbody></table></div>`
    return html
  }

  createHtml() {
    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`
      <p> 命令(byte${alive.cmd}) : ${this.bytes[alive.cmd]}</p>
      <p> 驗證(byte${alive.cmdCheck}) : ${this.bytes[alive.cmdCheck]}</p>`)}
        `

    html += this.roomInfo()
    html += `</div></div> `
    return html
  }
}

/**
 * 設定房間名單
 */
class InitRoomParser extends ModeParser {
  /**
   * - 10以後為住宿者資料共5個每個佔9byte，以8為範例
   * - 8為模式
   * - 9-12為UID
   * - 13-16為餘額
  */
  userInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>送電狀態</th><th>電權限</th><th>開門權限</th><th>管理員</th><th>bit</th><th>Byte</th><th>學號</th><th>Byte</th><th>卡號</th><th>Byte</th><th>餘額</th><th>Byte</th></tr><tbody>`
    let curr = roomInit.roomFeeDeductors + 1
    for (let i = 0; i < 6; i++) {
      const mode = Number(this.bytes[curr]) & 1
      const modeByteIndex = curr
      const modeBit = byteToBitStr(this.bytes[curr])
      const power = (Number(this.bytes[curr]) >> 5) & 1
      const door = (Number(this.bytes[curr]) >> 6) & 1
      const is_super = (Number(this.bytes[curr]) >> 7) & 1

      curr += 1
      const sid = this.Bstudent_id_to_str(this.bytes.slice(curr, curr + 4))
      const sidByte = `${curr} - ${curr + 3}`
      curr += 4
      const uid = this.DecimalNumber(this.bytes.slice(curr, curr + 4))
      const uidByte = `${curr} - ${curr + 3}`
      curr += 4
      const balance = this.Bbalance_to_str(this.bytes.slice(curr, curr + 4))
      const balanceByte = `${curr} - ${curr + 3}`
      curr += 4
      html += `<tr><td>${mode}</td><td>${power}</td><td>${door}</td><td>${is_super}</td><td>${modeBit}</td><td>${modeByteIndex}</td><td>${sid}</td><td>${sidByte}</td><td>${uid}</td><td>${uidByte}</td><td>${balance}</td><td>${balanceByte}</td></tr>`
    }
    html += `<tbody></table>`
    return html
  }

  createHtml() {
    const meterId = parseInt(this.bytes[roomInit.meterId], 10);
    const packageIndex = parseInt(this.bytes[roomInit.packageIndex], 10);
    const systemMode = parseInt(this.bytes[roomInit.systemMode], 10);
    const roomMode110 = parseInt(this.bytes[roomInit.roomMode110], 10);
    const roomMode220 = parseInt(this.bytes[roomInit.roomMode220], 10);
    const roomPrice110 = parseInt(this.bytes[roomInit.roomPrice110], 10);
    const roomPrice220 = parseInt(this.bytes[roomInit.roomPrice220], 10);
    const memberCount = parseInt(this.bytes[roomInit.memberCount], 10);
    const roomFeeDeductors = parseInt(this.bytes[roomInit.roomFeeDeductors], 10);


    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">
      ${this.titleHtml(`
      <p>Meter ID : ${meterId}</p>
      <p> 封包號碼(byte${roomInit.packageIndex}) : ${packageIndex}</p>
      <p> 系統模式(byte${roomInit.systemMode}) : ${systemMode}</p>
      <p> 房間模式220(byte${roomInit.roomMode220}) : ${roomMode220}</p>
      <p> 房間模式110(byte${roomInit.roomMode110}) : ${roomMode110}</p>
      <p> 計費價格220(byte${roomInit.roomPrice220}) : ${roomPrice220 / 10.0}</p>
      <p> 計費價格100(byte${roomInit.roomPrice110}) : ${roomPrice110 / 10.0}</p>
      <p> 房間人數(byte${roomInit.memberCount}) : ${memberCount}</p>
      <p> 計費人數(byte${roomInit.roomFeeDeductors}) : ${roomFeeDeductors}</p>`)}
      `

    html += this.userInfo()
    html += `</div></div> `
    return html
  }
}

/**
 * 設定房間模式費率
 */
class SetRoomModeParser extends ModeParser {
  /**
   * - 4以後為房間模式資料共23個每個佔4byte，以4為範例
   * - 4為110模式
   * - 5為220模式
   * - 6為110價格
   * - 7為220價格
  */
  roomInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>memter ID</th><th>110模式</th><th>Byte</th><th>220模式</th><th>Byte</th><th>110費率</th><th>Byte</th><th>220費率</th><th>Byte</th></tr><tbody>`
    let curr = 4
    for (let i = 0; i < 12; i++) {
      const mode110 = parseInt(this.bytes[curr], 10)
      const mode110Byte = curr
      curr += 1
      const mode220 = parseInt(this.bytes[curr], 10)
      const mode220Byte = curr
      curr += 1
      const price110 = parseInt(this.bytes[curr], 10) / 10
      const price110Byte = curr
      curr += 1
      const price220 = parseInt(this.bytes[curr], 10) / 10
      const price220Byte = curr
      curr += 1
      html += `<tr><td>${i + 1}</td><td>${mode110}</td><td>${mode110Byte}</td><td>${mode220}</td><td>${mode220Byte}</td>
               <td>${price110}</td><td>${price110Byte}</td><td>${price220}</td><td>${price220Byte}</td></tr>`
    }
    html += `<tbody></table>`
    html += `<div class="ms-3"><table class="table table-success table-striped">
    <thead><tr><th>memter ID</th><th>110模式</th><th>Byte</th><th>220模式</th><th>Byte</th><th>110費率</th><th>Byte</th><th>220費率</th><th>Byte</th></tr><tbody>`
    for (let i = 0; i < 11; i++) {
      const mode110 = parseInt(this.bytes[curr], 10)
      const mode110Byte = curr
      curr += 1
      const mode220 = parseInt(this.bytes[curr], 10)
      const mode220Byte = curr
      curr += 1
      const price110 = parseInt(this.bytes[curr], 10) / 10
      const price110Byte = curr
      curr += 1
      const price220 = parseInt(this.bytes[curr], 10) / 10
      const price220Byte = curr
      curr += 1
      html += `<tr><td>${i + 12}</td><td>${mode110}</td><td>${mode110Byte}</td><td>${mode220}</td><td>${mode220Byte}</td>
               <td>${price110}</td><td>${price110Byte}</td><td>${price220}</td><td>${price220Byte}</td></tr>`
    }

    html += `<tbody></table></div>`
    return html
  }

  createHtml() {
    const systemModeMode = parseInt(this.bytes[ctrChangeRoomData.systemMode], 10);

    let html = `
      <div class="card position-absolute d-flex parser d-none " draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p> 系統模式(byte${ctrChangeRoomData.systemMode}) : ${systemModeMode}</p>`)}
      `

    html += this.roomInfo()
    html += `</div></div> `
    return html
  }
}


/**
 * 設定USER 模式/餘額
 */
class ChangeUserDataParser extends ModeParser {
  userInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>Meter ID</th><th>Byte</th><th>房間扣款人數</th><th>Byte</th><th>房間第幾個人</th><th>Byte</th><th>模式</th><th>Byte</th><th>餘額</th><th>Byte</th></tr><tbody>`
    let count = this.bytes[ctrChangeUserData.setCount]
    let curr = 4
    for (let i = 0; i < count; i++) {
      const meterId = parseInt(this.bytes[curr], 10)
      const meterIdByte = curr
      curr += 1
      const chargeMemberCount = parseInt(this.bytes[curr], 10)
      const chargeMemberCountByte = curr
      curr += 1
      const memberIndex = parseInt(this.bytes[curr], 10)
      const memberIndexByte = curr
      curr += 1
      const mode = userModeHash[parseInt(this.bytes[curr], 10)]
      const modeByte = curr
      curr += 1
      const balance = this.Bbalance_to_str(this.bytes.slice(curr, curr + 4))
      const balanceByte = `${curr} - ${curr + 3}`
      curr += 4
      html += `<tr><td>${meterId}</td><td>${meterIdByte}</td><td>${chargeMemberCount}</td><td>${chargeMemberCountByte}</td><td>${memberIndex}</td><td>${memberIndexByte}</td><td>${mode}</td><td>${modeByte}</td><td>${balance}</td><td>${balanceByte}</td></tr>`
    }
    html += `<tbody></table>`
    return html
  }

  createHtml() {
    const setCount = parseInt(this.bytes[ctrChangeUserData.setCount], 10);

    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p> 設定幾筆(byte${ctrChangeUserData.setCount}) : ${setCount}</p>`)}
      `
    html += this.userInfo()
    html += `</div></div> `
    return html
  }
}

/**
 * GET全部房間電表度數
 */
class GetUserDataParser extends ModeParser {

  createHtml() {
    let meterId = parseInt(this.bytes[getUser.meterId], 10);
    let packageIndex = parseInt(this.bytes[getUser.packageIndex], 10);

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true"  id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p> Meter ID : ${meterId}</p><p> Package Index : ${packageIndex}</p>`)}
        `
    return html
  }
}


/**
 * GET全部房間電表度數
 */
class GetPower220Parser extends ModeParser {

  createHtml() {

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true"  id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml()}
        `
    return html
  }
}

/**
 * GET單個電表
 */
class GetPowerDetail220Parser extends ModeParser {

  createHtml() {

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p> Meter ID : ${this.bytes[3]}`)}
        `
    return html
  }
}

/**
 * GET全部房間電110表度數
 */
class GetPower110Parser extends ModeParser {

  createHtml() {

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true"  id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml()}
        `
    return html
  }
}

/**
 * GET單個110電表
 */
class GetPowerDetail110Parser extends ModeParser {

  createHtml() {

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p> meter ID:(byte${this.textList[3]})`)}
        `
    return html
  }
}

/** CTR_SET_SYSTEM_HW 
 * 
*/
class SetSystemHw extends ModeParser {

  cmd() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>命令參數</th><th>Bit</th><th>Byte</th></tr><tbody>`
    let arg = this.bytes[ctrSetSystemHw.systemArg]

    html += `<tr><td>${arg}</td><td>${byteToBitStr(arg)}</td><td>${ctrSetSystemHw.systemArg}</td></tr>`
    html += `<tbody></table>`
    return html
  }


  createHtml() {
    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true"  id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-aut3o btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`
        <p> 硬體命令:${this.bytes[ctrSetSystemHw.systemCmd]}(byte${ctrSetSystemHw.systemCmd})</p>
        <p> 硬體補數:${this.bytes[(ctrSetSystemHw.systemCmd + 1)]}(byte${(ctrSetSystemHw.systemCmd + 1)})</p>`)}
        `
    html += this.cmd()
    return html
  }
}



/**
 * 初始化和設定房間回傳
 */
class RspAckParser extends ModeParser {
  RoomStatus() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th></th>`
    for (let room = 0; room < maxRoom; room++) {
      html += `<th>Room ${room + 1}</th>`
    }
    html += `</tr><tbody>`

    let roomStatusHtml = "<tr><td>RoomStatus</td>"
    let roomMode110Html = "<tr><td>RoomMode110</td>"
    let roomMode220Html = "<tr><td>RoomMode220</td>"

    for (let startIndex = 0; startIndex < maxRoom; startIndex++) {
      let roomStatusIndex = ctrRsp.roomStatus + startIndex
      let roomMode110eIndex = ctrRsp.roomMode110 + startIndex
      let roomMode220Index = ctrRsp.roomMode220 + startIndex
      let roomStatusByte = parseInt(this.bytes[roomStatusIndex], 10)
      let roomMode110Byte = parseInt(this.bytes[roomMode110eIndex], 10)
      let roomMode220Byte = parseInt(this.bytes[roomMode220Index], 10)

      roomStatusHtml += `<td>Byte${roomStatusIndex}<br>${roomStatusByte}</td>`
      roomMode110Html += `<td>Byte${roomMode110eIndex}<br>${getRoomMode(roomMode110Byte)}</td>`
      roomMode220Html += `<td>Byte${roomMode220Index}<br>${getRoomMode(roomMode220Byte)}</td>`
    }
    roomStatusHtml += `</tr>`
    roomMode110Html += `</tr>`
    roomMode220Html += `</tr>`
    html += roomStatusHtml + roomMode220Html + roomMode110Html + `<tbody></table>`
    return html
  }

  createHtml() {
    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">
      ${this.titleHtml(``)}
      `
    html += this.RoomStatus()
    html += `</div></div> `
    return html
  }
}

/**
 * 系統訊息
 */
class RspSystemInfoParser extends ModeParser {
  /**
 */
  RoomStatus() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>設備名稱</th><th>Byte</th><th>bit</th><th>錯誤</th></tr><tbody>`
    let powerMeterHtml = ""
    let meterHtml = ""
    for (let startIndex = 0; startIndex < 4; startIndex++) {
      let id = 1 + (3 - startIndex) * 8
      let powerMeterError = []
      let powerMeterByteIndex = ctrRspSystemInfo.powerMeterError + startIndex
      let powerMeterByte = parseInt(this.bytes[powerMeterByteIndex], 10)
      for (let bit = 0; bit < 8; bit++) {
        if ((powerMeterByte >> bit) & 1 == 1) {
          powerMeterError.push(id + bit)
        }
      }
      let powerMeterBit = byteToBitStr(powerMeterByte)
      let powerMeter = `電錶 ${(3 - startIndex) * 8}~${1 + (2 - startIndex) * 8}`
      powerMeterHtml += `<tr><td>${powerMeter}</td><td>${powerMeterByteIndex}</td><td>${powerMeterBit}</td><td>${powerMeterError.reverse().join(', ')}</td></tr>`
    }

    let meterError = []
    let meterByteIndex = ctrRspSystemInfo.meterError
    let meterByte = parseInt(this.bytes[meterByteIndex], 10)
    for (let bit = 0; bit < 2; bit++) {
      if ((meterByte >> bit) & 1 == 1) {
        meterError.push(bit+1)
      }
    }
    let meterBit = byteToBitStr(meterByte)
    let meter = `meter 2~1`
    meterHtml += `<tr><td>${meter}</td><td>${meterByteIndex}</td><td>${meterBit}</td><td>${meterError.reverse().join(', ')}</td></tr>`

    html += powerMeterHtml + meterHtml + `<tbody></table>`
    return html
  }

  UseMeter() {
    let html = `<div class="ms-2"><table class="table table-success table-striped">
    <thead><tr><th>設備名稱</th><th>Byte</th><th>bit</th><th>啟用meter</th></tr><tbody>`
    let useMeter = []
    let useMeterHtml = ""
    let meterByteIndex = ctrRspSystemInfo.meterError
    let meterByte = parseInt(this.bytes[meterByteIndex], 10)
    for (let bit = 0; bit < 2; bit++) {
      if ((meterByte >> bit) & 1 == 1) {
        useMeter.push(bit)
      }
    }
    let meterBit = byteToBitStr(meterByte)
    let meter = `using meter 2~1`
    useMeterHtml += `<tr><td>${meter}</td><td>${meterByteIndex}</td><td>${meterBit}</td><td>${useMeter.reverse().join(', ')}</td></tr>`

    html += useMeterHtml + `<tbody></table></div>`
    return html
  }


  createHtml() {
    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">
      ${this.titleHtml()}
      `
    html += this.RoomStatus()
    html += this.UseMeter()
    html += `</div></div> `
    return html
  }
}


/**
 * RSP 讀取單個電表詳細資料
 */
class RspPowerDetailParser extends ModeParser {

  /**
   *  
  */
  meter() {
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th></th><th>使用總電度</th><th>電壓</th><th>電流</th><th>頻率</th><th>功率因子</th><th>虛功率</th><th>有效功率</th></tr></thead><tbody>`
    const totalPower = this.Bnum_to_dec(this.bytes.slice(ctrRspPowerData.totalPower, ctrRspPowerData.totalPower + 4))
    const meterValtage = this.Bnum_to_dec(this.bytes.slice(ctrRspPowerData.meterValtage, ctrRspPowerData.meterValtage + 4))
    let arr = this.bytes.slice(ctrRspPowerData.meterFreq, ctrRspPowerData.meterFreq + 2)
    arr.unshift(0, 0)
    const meterFreq = this.Bnum_to_dec(arr)
    arr = this.bytes.slice(ctrRspPowerData.meterPowerFactor, ctrRspPowerData.meterPowerFactor + 2)
    arr.unshift(0, 0)
    const meterPowerFactor = this.Bnum_to_dec(arr)
    const meterCurrent = this.Bnum_to_dec(this.bytes.slice(ctrRspPowerData.meterCurrent, ctrRspPowerData.meterCurrent + 4))
    const meterVA = this.Bnum_to_dec(this.bytes.slice(ctrRspPowerData.meterVA, ctrRspPowerData.meterVA + 4))
    const meterActPower = this.Bnum_to_dec(this.bytes.slice(ctrRspPowerData.meterActPower, ctrRspPowerData.meterActPower + 4))

    html += `<tr>
             <td>byte</td>
             <td>${ctrRspPowerData.totalPower}~${ctrRspPowerData.totalPower + 3}</td>
             <td>${ctrRspPowerData.meterValtage}~${ctrRspPowerData.meterValtage + 3}</td>
             <td>${ctrRspPowerData.meterCurrent}~${ctrRspPowerData.meterCurrent + 3}</td>
             <td>${ctrRspPowerData.meterFreq}~${ctrRspPowerData.meterFreq + 1}</td>
             <td>${ctrRspPowerData.meterPowerFactor}~${ctrRspPowerData.meterPowerFactor + 1}</td>
             <td>${ctrRspPowerData.meterVA}~${ctrRspPowerData.meterVA + 3}</td>
             <td>${ctrRspPowerData.meterActPower}~${ctrRspPowerData.meterActPower + 3}</td>
             </tr>
             `
    html += `<tr><td></td><td>${totalPower}</td><td>${meterValtage}</td><td>${meterCurrent}</td><td>${meterFreq}</td><td>${meterPowerFactor}</td><td>${meterVA}</td><td>${meterActPower}</td></tr>
             </tbody></table>`

    return html
  }

  createHtml() {
    const meterId = parseInt(this.bytes[ctrRspPowerData.meterId], 10);
    const mode = parseInt(this.bytes[ctrRspPowerData.mode], 10);
    const rate = parseInt(this.bytes[ctrRspPowerData.rate], 10);
    const powerOnOff = parseInt(this.bytes[ctrRspPowerData.powerOnOff], 10);

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`
          <p>MeterID(Byte${ctrRspPowerData.meterId}) : ${meterId}</p>
          <p>模式(Byte${ctrRspPowerData.mode}) : ${mode}</p>
          <p>通訊率(Byte${ctrRspPowerData.rate}) : ${rate}</p>
          <p>繼電器狀態(Byte${ctrRspPowerData.powerOnOff}) : ${powerOnOff}</p>`)}
        `

    html += this.meter()
    html += `</div></div> `

    return html
  }
}



let modeParser = {
  '16': AliveParser,
  '17': GetPowerDetail220Parser,
  '18': SetSystemHw,
  '48': RspAckParser,
  '49': RspSystemInfoParser,
  '50': RspPowerDetailParser,
}