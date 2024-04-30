const byteToBitStr = (byte)=>{
  return Number(byte).toString(2).padStart(8, '0').replace(/(.{4})(.{4})/, "$1 $2")
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


  Bdegree_to_degree(Bdegree) {
    let degree = 0
    degree = Number(Bdegree[3]) << 24
    degree += Number(Bdegree[2]) << 16
    degree += Number(Bdegree[1]) << 8
    degree += Number(Bdegree[0])
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
class Mode16Parser extends ModeParser {

  createHtml() {
    const byte3Dec = parseInt(this.bytes[3], 10);
    const byte4Dec = parseInt(this.bytes[4], 10);

    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p> 上次已讀紀錄數量(byte3) : ${byte3Dec}</p><p> 驗證(byte4) : ${byte4Dec}</p>`)}
      `

    html += `</div></div> `
    return html
  }
}

/**
 * 設定房間名單
 */
class Mode17Parser extends ModeParser {
  /**
   * - 10以後為住宿者資料共5個每個佔9byte，以8為範例
   * - 8為模式
   * - 9-12為UID
   * - 13-16為餘額
  */
  userInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>送電狀態</th><th>Byte</th><th>學號</th><th>Byte</th><th>卡號</th><th>Byte</th><th>餘額</th><th>Byte</th></tr><tbody>`
    let curr = 10
    for (let i = 0; i < 6; i++) {
      const mode = userModeHash[parseInt(this.bytes[curr], 10)]
      const modeByte = curr
      curr += 1
      const sid = this.Bstudent_id_to_str(this.bytes.slice(curr, curr + 4))
      const sidByte = `${curr} - ${curr + 3}`
      curr += 4
      const uid = this.Bidcard_to_str(this.bytes.slice(curr, curr + 4))
      const uidByte = `${curr} - ${curr + 3}`
      curr += 4
      const balance = this.Bbalance_to_str(this.bytes.slice(curr, curr + 4))
      const balanceByte = `${curr} - ${curr + 3}`
      curr += 4
      html += `<tr><td>${mode}</td><td>${modeByte}</td><td>${sid}</td><td>${sidByte}</td><td>${uid}</td><td>${uidByte}</td><td>${balance}</td><td>${balanceByte}</td></tr>`
    }
    html += `<tbody></table>`
    return html
  }

  createHtml() {
    const meterId = parseInt(this.bytes[roomInit.meterId], 10);
    const packageIndex = parseInt(this.bytes[roomInit.packageIndex], 10);
    const systemMode = parseInt(this.bytes[roomInit.systemMode], 10);
    const roomMode = parseInt(this.bytes[roomInit.roomMode], 10);
    const roomPrice = parseInt(this.bytes[roomInit.roomPrice], 10);
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
      <p> 房間模式(byte${roomInit.roomMode}) : ${roomMode}</p>
      <p> 計費價格(byte${roomInit.roomPrice}) : ${roomPrice / 10.0}</p>
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
class Mode18Parser extends ModeParser {
  /**
   * - 8以後為住宿者資料共5個每個佔9byte，以8為範例
   * - 8為模式
   * - 9-12為UID
   * - 13-16為餘額
  */
  roomInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>memter ID</th><th>模式</th><th>Byte</th><th>費率</th><th>Byte</th></tr><tbody>`
    let curr = 4
    for (let i = 0; i < 12; i++) {
      const mode = parseInt(this.bytes[curr], 10)
      const modeByte = curr
      curr += 1
      const price = parseInt(this.bytes[curr], 10) / 10
      const priceByte = curr
      curr += 1
      html += `<tr><td>${i+1}</td><td>${mode}</td><td>${modeByte}</td><td>${price}</td><td>${priceByte}</td></tr>`
    }
    html += `<tbody></table>`
    html += `<div class="ms-3"><table class="table table-success table-striped">
    <thead><tr><th>memter ID</th><th>模式</th><th>Byte</th><th>費率</th><th>Byte</th></tr><tbody>`
    for (let i = 0; i < 11; i++) {
      const mode = parseInt(this.bytes[curr], 10)
      const modeByte = curr
      curr += 1
      const price = parseInt(this.bytes[curr], 10) / 10
      const priceByte = curr
      curr += 1
      html += `<tr><td>${12+i}</td><td>${mode}</td><td>${modeByte}</td><td>${price}</td><td>${priceByte}</td></tr>`
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
class Mode19Parser extends ModeParser {
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
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p> 設定幾筆(byte${ctrChangeRoomData.setCount}) : ${setCount}</p>`)}
      `
    html += this.userInfo()
    html += `</div></div> `
    return html
  }
}



/**
 * GET全部房間電表度數
 */
class Mode20Parser extends ModeParser {

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
class Mode21Parser extends ModeParser {

  createHtml() {

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p> meter ID:(byte${this.textList[3]})`)}
        `
    return html
  }
}






/**
 * Alive回傳系統訊和進出紀錄
 */
class Mode48Parser extends ModeParser {
  DeviceError() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>設備名稱</th><th>Byte</th><th>bit</th><th>錯誤</th></tr><tbody>`
    let readerHtml = ""
    let powerMeterHtml = ""
    let meterHtml = ""

    for (let startIndex = 0; startIndex < 3; startIndex++) {
      let readerError = []
      let powerMeterError = []
      let meterError = []
      let readerByteIndex = ctrRspSystemInfo.readerDeviceError+startIndex
      let powerMeterByteIndex = ctrRspSystemInfo.powerMeterDeviceError+startIndex
      let meterByteIndex = ctrRspSystemInfo.meterDeviceError+startIndex
      let meterByte = parseInt(this.bytes[meterByteIndex], 10)
      let powerMeterByte = parseInt(this.bytes[ powerMeterByteIndex], 10)
      let readerByte = parseInt(this.bytes[readerByteIndex], 10)

      let readerDevice = `reader ${(3-startIndex)*8}~${1+(2-startIndex)*8}`
      let powerMeterDevice = `電錶 ${(3-startIndex)*8}~${1+(2-startIndex)*8}`
      let meterDevice = `meter ${(3-startIndex)*8}~${1+(2-startIndex)*8}`

      let id = 1+(2-startIndex)*8
      for(let bit = 0; bit< 8; bit++) {
        if((readerByte>>bit)&1==1){
          readerError.push(id+bit)
        }
        if((powerMeterByte>>bit)&1==1){
          powerMeterError.push(id+bit)
        }
        if((meterByte>>bit)&1==1){
          meterError.push(id+bit)
        }
      }
      let readerBit = byteToBitStr(readerByte)
      let meterBit = byteToBitStr(meterByte)
      let powerMeterBit = byteToBitStr(powerMeterByte)
      readerHtml += `<tr><td>${readerDevice}</td><td>${readerByteIndex}</td><td>${readerBit}</td><td>${readerError.reverse().join(', ')}</td></tr>`
      meterHtml += `<tr><td>${meterDevice}</td><td>${meterByteIndex}</td><td>${meterBit}</td><td>${meterError.reverse().join(', ')}</td></tr>`
      powerMeterHtml += `<tr><td>${powerMeterDevice}</td><td>${powerMeterByteIndex}</td><td>${powerMeterBit}</td><td>${powerMeterError.reverse().join(', ')}</td></tr>`
    
    }
    html +=  readerHtml  + powerMeterHtml + meterHtml + `<tbody></table>`
    return html
  }

  userAccessRecord() {
    let html = `<div class="ms-3"><table class="table table-success table-striped">
    <thead><tr><th>狀態</th><th>meter_id</th><th>Bit</th><th>Byte</th><th>卡號</th><th>Byte</th><th>進出時間</th><th>Byte</th></tr><tbody>`
    let curr = 14
    for (let i = 0; i < 7; i++) {
      const status = this.bytes[curr] >> 7 
      const meter_id = this.bytes[curr] & 31
      const statusByte = curr
      const statusBit = byteToBitStr(this.bytes[curr])
      curr += 1
      const uid = this.Bidcard_to_str(this.bytes.slice(curr, curr + 4))
      const uidByte = `${curr} - ${curr + 3}`
      curr += 4
      let year = "20" + this.bytes[curr]
      let month = this.bytes[curr+1].padStart(2, '0')
      let day = this.bytes[curr+2]
      let hour = this.bytes[curr+3]
      let minute = this.bytes[curr+4]
      let second = this.bytes[curr+5]
      const time =`${year}-${month}-${day} ${hour}:${minute}:${second}`
      const timeByte = `${curr} - ${curr + 6}`
      curr += 6
      html += `<tr><td>${status}</td><td>${meter_id}</td><td>${statusBit}</td><td>${statusByte}</td><td>${uid}</td><td>${uidByte}</td><td>${time}</td><td>${timeByte}</td></tr>`
    }
    html += `<tbody></table></div>`
    return html
  }

  createHtml() {
    const newRecordCounter = parseInt(this.bytes[ctrRspSystemInfo.newRecordCounter], 10);
    const recordReadPoint = parseInt(this.bytes[ctrRspSystemInfo.recordReadPoint], 10);


    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">
      ${this.titleHtml(`
      <p> 未讀取紀錄數量(byte${ctrRspSystemInfo.newRecordCounter}) : ${newRecordCounter}</p>
      <p> 資料於Ring中的起始位置(byte${ctrRspSystemInfo.recordReadPoint}) : ${recordReadPoint}</p>`)}
      `
    html += this.DeviceError()
    html += this.userAccessRecord()
    html += `</div></div> `
    return html
  }
}

/**
 * 系統訊息
 */
class Mode49Parser extends ModeParser {
  /**
 * GET全部房間電表度數
 */
  RoomStatus() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>設備名稱</th><th>Byte</th><th>bit</th><th>錯誤</th></tr><tbody>`
    let readerHtml = ""
    let powerMeterHtml = ""
    let meterHtml = ""

    for (let startIndex = 0; startIndex < 3; startIndex++) {
      let readerError = []
      let powerMeterError = []
      let meterError = []
      let readerByteIndex = ctrRspSystemInfo.readerDeviceError+startIndex
      let powerMeterByteIndex = ctrRspSystemInfo.powerMeterDeviceError+startIndex
      let meterByteIndex = ctrRspSystemInfo.meterDeviceError+startIndex
      let meterByte = parseInt(this.bytes[meterByteIndex], 10)
      let powerMeterByte = parseInt(this.bytes[ powerMeterByteIndex], 10)
      let readerByte = parseInt(this.bytes[readerByteIndex], 10)

      let readerDevice = `reader ${(3-startIndex)*8}~${1+(2-startIndex)*8}`
      let powerMeterDevice = `電錶 ${(3-startIndex)*8}~${1+(2-startIndex)*8}`
      let meterDevice = `meter ${(3-startIndex)*8}~${1+(2-startIndex)*8}`

      let id = 1+(2-startIndex)*8
      for(let bit = 0; bit< 8; bit++) {
        if((readerByte>>bit)&1==1){
          readerError.push(id+bit)
        }
        if((powerMeterByte>>bit)&1==1){
          powerMeterError.push(id+bit)
        }
        if((meterByte>>bit)&1==1){
          meterError.push(id+bit)
        }
      }
      let readerBit = byteToBitStr(readerByte)
      let meterBit = byteToBitStr(meterByte)
      let powerMeterBit = byteToBitStr(powerMeterByte)
      readerHtml += `<tr><td>${readerDevice}</td><td>${readerByteIndex}</td><td>${readerBit}</td><td>${readerError.reverse().join(', ')}</td></tr>`
      meterHtml += `<tr><td>${meterDevice}</td><td>${meterByteIndex}</td><td>${meterBit}</td><td>${meterError.reverse().join(', ')}</td></tr>`
      powerMeterHtml += `<tr><td>${powerMeterDevice}</td><td>${powerMeterByteIndex}</td><td>${powerMeterBit}</td><td>${powerMeterError.reverse().join(', ')}</td></tr>`
    
    }
    html +=  readerHtml  + powerMeterHtml + meterHtml + `<tbody></table>`
    return html
  }

  RoomMode() {
    let html = `<div class="ms-3"><table class="table table-success table-striped">
    <thead><tr><th>狀態</th><th>meter_id</th><th>Bit</th><th>Byte</th><th>卡號</th><th>Byte</th><th>進出時間</th><th>Byte</th></tr><tbody>`
    let curr = 14
    for (let i = 0; i < 7; i++) {
      const status = this.bytes[curr] >> 7 
      const meter_id = this.bytes[curr] & 31
      const statusByte = curr
      const statusBit = byteToBitStr(this.bytes[curr])
      curr += 1
      const uid = this.Bidcard_to_str(this.bytes.slice(curr, curr + 4))
      const uidByte = `${curr} - ${curr + 3}`
      curr += 4
      let year = "20" + this.bytes[curr]
      let month = this.bytes[curr+1].padStart(2, '0')
      let day = this.bytes[curr+2]
      let hour = this.bytes[curr+3]
      let minute = this.bytes[curr+4]
      let second = this.bytes[curr+5]
      const time =`${year}-${month}-${day} ${hour}:${minute}:${second}`
      const timeByte = `${curr} - ${curr + 6}`
      curr += 6
      html += `<tr><td>${status}</td><td>${meter_id}</td><td>${statusBit}</td><td>${statusByte}</td><td>${uid}</td><td>${uidByte}</td><td>${time}</td><td>${timeByte}</td></tr>`
    }
    html += `<tbody></table></div>`
    return html
  }

  createHtml() {
    const newRecordCounter = parseInt(this.bytes[ctrRspSystemInfo.newRecordCounter], 10);
    const recordReadPoint = parseInt(this.bytes[ctrRspSystemInfo.recordReadPoint], 10);


    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">
      ${this.titleHtml(`
      <p> 未讀取紀錄數量(byte${ctrRspSystemInfo.newRecordCounter}) : ${newRecordCounter}</p>
      <p> 資料於Ring中的起始位置(byte${ctrRspSystemInfo.recordReadPoint}) : ${recordReadPoint}</p>`)}
      `
    html += this.RoomStatus()
    html += this.RoomMode()
    html += `</div></div> `
    return html
  }
}

/**
 * RSP 讀取電表度數資訊
 */
class Mode50Parser extends ModeParser {
  /**
   *  6之後每8個byte，以6為範例
   *  - 6-9 為 220瓦特
   *  - 10-13 為 110瓦特
  */
  meterWatt() {
    const byte5Dec = parseInt(this.bytes[5], 10); // 第幾個封包
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th>房間ID</th><th>110瓦特</th><th>byte</th></tr></thead><tbody>`

    let curr = 3
    for (let i = 0; i < 22; i++) {
      const watt110 = this.Bdegree_to_degree(this.bytes.slice(curr, curr + 4))
      const watt110byte = `${curr}-${curr + 3}`
      curr += 4
      html += `<tr><td>${i + 1 + byte5Dec * 5}</td><td>${watt110}</td>
               <td>${watt110byte}</td></tr>`
    }
    html += '</tbody></table>'
    return html
  }

  createHtml() {
    const byte4Dec = parseInt(this.bytes[4], 10);
    const byte5Dec = parseInt(this.bytes[5], 10);

    let html = `
      <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>Meter ID : ${byte4Dec}</p><p> 封包號碼(byte5) : ${byte5Dec}</p>`)}
      `

    html += this.meterWatt()
    html += `</div></div> `
    return html
  }
}

/**
 * RSP 讀取單個電表詳細資料
 */
class Mode51Parser extends ModeParser {

  /**
   *  - 5-8 為 220瓦特
   *  - 9-12 為 110瓦特
  */
  meterWatt() {
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th></th><th>watt</th><th>byte</th></tr></thead><tbody>`

    const watt220 = parseInt(this.bytes.slice(5, 9).join(''), 10)
    const watt110 = parseInt(this.bytes.slice(9, 13).join(''), 10)
    html += `<tr><td>220V</td><td>${watt220}</td><td>5-8</td></tr>
             <tr><td>110V</td><td>${watt110}</td><td>9-12</td></tr>
             </tbody></table>`

    return html
  }

  /**
   *  - 13-16 為 220伏特
   *  - 9-12 為 110伏特
  */
  meterVolt() {
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th></th><th>VOLT</th><th>byte</th></tr></thead><tbody>`

    const volt220 = parseInt(this.bytes.slice(13, 17).join(''), 10)
    const volt110 = parseInt(this.bytes.slice(17, 21).join(''), 10)
    html += `<tr><td>220V</td><td>${volt220}</td><td>13-16</td></tr>
             <tr><td>110V</td><td>${volt110}</td><td>17-20</td></tr>
             </tbody></table>`
    return html
  }

  /**
   *  - 21-24 為 220電流
   *  - 25-28 為 110電流
  */
  meterI() {
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th></th><th>電流</th><th>byte</th></tr></thead><tbody>`

    const I220 = parseInt(this.bytes.slice(21, 25).join(''), 10)
    const I110 = parseInt(this.bytes.slice(25, 29).join(''), 10)
    html += `<tr><td>220V</td><td>${I220}</td><td>21-24</td></tr>
             <tr><td>110V</td><td>${I110}</td><td>25-28</td></tr>
             </tbody></table>`
    return html
  }


  /**
  *  - 29-30 為 220法拉
  *  - 31-32 為 110法拉
 */
  meterF() {
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th></th><th>法拉</th><th>byte</th></tr><tbody>`

    const F220 = parseInt(this.bytes.slice(29, 31).join(''), 10)
    const F110 = parseInt(this.bytes.slice(31, 33).join(''), 10)
    html += `<tr><td>220V</td><td>${F220}</td><td>29-30</td></tr>
             <tr><td>110V</td><td>${F110}</td><td>31-32</td></tr>
             </tbody></table>`
    return html
  }


  createHtml() {
    const byte4Dec = parseInt(this.bytes[4], 10);

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>MeterID(Byte4) : ${byte4Dec}</p>`)}
        `

    html += this.meterWatt()
    html += this.meterVolt()
    html += this.meterI()
    html += this.meterF()
    html += `</div></div> `

    return html
  }
}


/**
 * RSP 用電紀錄
 */
class Mode52Parser extends ModeParser {


  /**
   * - 18-21 開始餘額
   * - 22-25 結束餘額
  */
  balance() {
    let html = `<table class="table table-success table-striped mx-3 align-self-start">
      <thead><tr><th colspan="${2}">餘額紀錄Byte 18-25</th></tr><tbody>`

    let startBalance = parseInt(this.bytes.slice(18, 22).join(''), 10)
    let endBalance = parseInt(this.bytes.slice(22, 26).join(''), 10)

    html += `<tr><td>開始餘額</td><td>${startBalance}</td></tr>
             <tr><td>結束餘額</td><td>${endBalance}</td></tr>
             </tbody></table>`
    return html
  }


  /**
   * - 26-29 開始度數
   * - 30-34 結束度數
  */
  meterValue() {
    let html = `<table class="table table-success table-striped mx-3 align-self-start">
      <thead><tr><th colspan="${2}">度數紀錄Byte 26-34</th></tr><tbody>`

    let startWatt = parseInt(this.bytes.slice(26, 30).join(''), 10)
    let endWatt = parseInt(this.bytes.slice(30, 34).join(''), 10)

    html += `<tr><td>開始度數</td><td>${startWatt}</td></tr>
             <tr><td>結束度數</td><td>${endWatt}</td></tr>
             </tbody></table>`
    return html
  }

  createHtml() {
    const byte4Dec = parseInt(this.bytes[4], 10);
    const byte5Dec = parseInt(this.bytes[5], 10);

    let html = `
        <div class="card position-absolute d-flex parser d-none" draggable="true" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>房號ID(byte4) : ${byte4Dec}</p><p>學生ID(byte5) : ${byte5Dec}</p>`)}
        `

    html += this.time(this.bytes.slice(6, 12), '<tr><th colspan="6">開始時間 Byte 6-11</th></tr>')
    html += this.time(this.bytes.slice(12, 18), '<tr><th colspan="6">結束時間 Byte 12-17</th></tr>')
    html += this.balance()
    html += this.meterValue()

    html += `</div></div> `
    return html
  }
}

/**
 * 房間用戶資料
 */
class Mode53Parser extends ModeParser {
  /**
   * - 10以後為住宿者資料共5個每個佔9byte，以8為範例
   * - 8為模式
   * - 9-12為UID
   * - 13-16為餘額
  */
  userInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>送電狀態</th><th>Byte</th><th>學號</th><th>Byte</th><th>卡號</th><th>Byte</th><th>餘額</th><th>Byte</th></tr><tbody>`
    let curr = 10
    for (let i = 0; i < 6; i++) {
      const mode = userModeHash[parseInt(this.bytes[curr], 10)]
      const modeByte = curr
      curr += 1
      const sid = this.Bstudent_id_to_str(this.bytes.slice(curr, curr + 4))
      const sidByte = `${curr} - ${curr + 3}`
      curr += 4
      const uid = this.Bidcard_to_str(this.bytes.slice(curr, curr + 4))
      const uidByte = `${curr} - ${curr + 3}`
      curr += 4
      const balance = this.Bbalance_to_str(this.bytes.slice(curr, curr + 4))
      const balanceByte = `${curr} - ${curr + 3}`
      curr += 4
      html += `<tr><td>${mode}</td><td>${modeByte}</td><td>${sid}</td><td>${sidByte}</td><td>${uid}</td><td>${uidByte}</td><td>${balance}</td><td>${balanceByte}</td></tr>`
    }
    html += `<tbody></table>`
    return html
  }

  createHtml() {
    const meterId = parseInt(this.bytes[roomInit.meterId], 10);
    const packageIndex = parseInt(this.bytes[roomInit.packageIndex], 10);
    const systemMode = parseInt(this.bytes[roomInit.systemMode], 10);
    const roomMode = parseInt(this.bytes[roomInit.roomMode], 10);
    const roomPrice = parseInt(this.bytes[roomInit.roomPrice], 10);
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
      <p> 房間模式(byte${roomInit.roomMode}) : ${roomMode}</p>
      <p> 計費價格(byte${roomInit.roomPrice}) : ${roomPrice / 10.0}</p>
      <p> 房間人數(byte${roomInit.memberCount}) : ${memberCount}</p>
      <p> 計費人數(byte${roomInit.roomFeeDeductors}) : ${roomFeeDeductors}</p>`)}
      `

    html += this.userInfo()
    html += `</div></div> `
    return html
  }
}

let modeParser = {
  '16': Mode16Parser,
  '17': Mode17Parser,
  '18': Mode18Parser,
  '19': Mode19Parser,
  '20': Mode20Parser,
  '21': Mode21Parser,
  '22': Mode21Parser,
  '48': Mode48Parser,
  '49': Mode49Parser,
  '50': Mode50Parser,
  '51': Mode51Parser,
  '52': Mode52Parser,
}