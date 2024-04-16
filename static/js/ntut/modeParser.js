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
    const byte2Dec = parseInt(this.bytes[2].slice(0, 2), 10);
    const modeName = byte2Name[byte2Dec] || byte2Dec
    return `<div class="m-3"><p>模式 : ${modeName}<br>(DEC:${byte2Dec})
    </p><p>Center ID : ${byte1Dec}${html}</p></div>`
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
   * @param {Array} Bbalance 陣列4個
   */
  Bbalance_to_str(Bbalance) {
    let balance = 0
    balance = balance | Number(Bbalance[0]) << 24
    balance = balance | Number(Bbalance[1]) << 16
    balance = balance | Number(Bbalance[2]) << 8
    balance = balance | Number(Bbalance[3])
    return balance / 1000
  }


  price_format(price) {
    if (price === 255 || price === '255') {
      return '不變'
    }
    return parseInt(price, 10) / 10.0
  }
}


/**
 * 設定房間參數
 */
class Mode17Parser extends ModeParser {

  /** 
   * pwd = 52 % 10
   * - 下面模式價格都有加pwd要扣除才是設定值
   * - 5 220v模式
   * - 6 220v價格
   * - 7 110v模式
   * - 8 110v價格
   * - 9 系統模式
  */
  roomInfo() {
    let mode220 = roomModeHash[parseInt(this.bytes[5], 10)] || roomModeHash['error'](parseInt(this.bytes[9], 10))
    let mode110 = roomModeHash[parseInt(this.bytes[7], 10)] || roomModeHash['error'](parseInt(this.bytes[9], 10))
    let price220 = this.price_format(this.bytes[6])
    let price110 = this.price_format(this.bytes[8])
    let systemMode = systemHash[parseInt(this.bytes[9], 10)] || systemHash['error'](parseInt(this.bytes[9], 10))
    let html = `<table class="table table-success table-striped mx-3"><thead>
    <tr><th colspan="5">Meter電錶模式度數Byte 5-9</th></tr><tbody>
    <tr><td>電壓</td><td>模式</td><td>模式Byte</td><td>價格</td><td>價格Byte</td></tr>
    <tr><td>220</td><td>${mode220}</td><td>${5}</td><td>${price220}</td><td>${6}</td></tr>
    <tr><td>110</td><td>${mode110}</td><td>${7}</td><td>${price110}</td><td>${8}</td></tr>
    <tr><th colspan="5">系統模式Byte${9}</th></tr>
    <tr><td colspan="5">${systemMode}</td></tr>
    <tbody></table>`
    return html
  }



  createHtml() {
    const byte4Dec = parseInt(this.bytes[4], 10);
    const cardId = this.Bidcard_to_str(this.bytes.slice(11, 15))

    let html = `
      <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>Meter ID : ${byte4Dec}</p><p>卡號: ${cardId}</br>(byte11-14) </p>`)}
      `

    html += this.roomInfo()
    html += this.time(this.bytes.slice(47, 53), '<tr><th colspan="6">設定時間 Byte 47-52</th></tr>')
    html += `</div></div> `
    return html
  }

}


/**
 * 設定房間名單
 */
class Mode18Parser extends ModeParser {
  /**
   * - 7以後為住宿者資料共5個每個佔9byte，以8為範例
   * - 7為模式
   * - 8-11為UID
   * - 12-15為餘額
  */
  userInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>學生ID</th><th>送電狀態</th><th>Byte</th><th>UID</th><th>Byte</th><th>餘額</th><th>Byte</th></tr><tbody>`
    let curr = 7
    for (let i = 0; i < 5; i++) {
      const id = i + parseInt(this.bytes[6], 10) * 5 + 1
      const mode = userModeHash[parseInt(this.bytes[curr], 10)]
      const modeByte = curr
      curr += 1
      const uid = this.Bidcard_to_str(this.bytes.slice(curr, curr + 4))
      const uidByte = `${curr} - ${curr + 3}`
      curr += 4
      const balance = this.Bbalance_to_str(this.bytes.slice(curr, curr + 4))
      const balanceByte = `${curr} - ${curr + 3}`
      curr += 4
      html += `<tr><td>${id}</td><td>${mode}</td><td>${modeByte}</td><td>${uid}</td><td>${uidByte}</td><td>${balance}</td><td>${balanceByte}</td></tr>`
    }
    html += `<tbody></table>`
    return html
  }

  createHtml() {
    const byte4Dec = parseInt(this.bytes[4], 10);
    const byte5Dec = parseInt(this.bytes[5], 10);
    const byte6Dec = parseInt(this.bytes[6], 10);

    let html = `
      <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>Meter ID : ${byte4Dec}</p><p> 房間人數(byte5) : ${byte5Dec}</p><p> 封包號碼(byte6) : ${byte6Dec}</p>`)}
      `

    html += this.userInfo()
    html += `</div></div> `
    return html
  }
}

/**
 * 設定房間名單單個
 */
class Mode19Parser extends ModeParser {
  /**
   * - 7以後為住宿者資料共5個每個佔9byte，以8為範例
   * - 7為模式
   * - 8-11為UID
   * - 12-15為餘額
  */
  userInfo() {
    let html = `<table class="table table-success table-striped align-self-start">
    <thead><th>送電狀態</th><th>Byte</th><th>UID</th><th>Byte</th><th>餘額</th><th>Byte</th></tr><tbody>`
    const mode = userModeHash[parseInt(this.bytes[7], 10)]
    const modeByte = 7
    const uid = this.Bidcard_to_str(this.bytes.slice(8, 12))
    const uidByte = `${8} - ${11}`
    const balance = this.Bbalance_to_str(this.bytes.slice(12, 17))
    const balanceByte = `${12} - ${15}`
    html += `<tr><td>${mode}</td><td>${modeByte}</td><td>${uid}</td><td>${uidByte}</td><td>${balance}</td><td>${balanceByte}</td></tr>`
    html += `<tbody></table>`
    return html
  }

  createHtml() {
    const byte4Dec = parseInt(this.bytes[4], 10);
    const byte5Dec = parseInt(this.bytes[5], 10);
    const byte6Dec = parseInt(this.bytes[6], 10);

    let html = `
      <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>Meter ID : ${byte4Dec}</p><p> 房間人數(byte5) : ${byte5Dec}</p><p> 封包號碼(byte6) : ${byte6Dec}</p>`)}
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
    const byte5Dec = parseInt(this.bytes[4], 10);

    let html = `
        <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>封包號碼(byte5) : ${byte5Dec}</p>`)}
        `
    return html
  }
}

/**
 * RSP Alive
 */
class Mode49Parser extends ModeParser {
  /**
   * 5-7 為 MeterBoardError 異常判斷
  */
  meterBoardErrorCheck() {
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th colspan="3">MeterBoardError </br>Byte 5-7</th></tr><tbody><tr>
      <thead><tr><th>Byte</th><th>bit</th><th>異常ID</th></tr><tbody><tr>`

    this.bytes.slice(5, 8).forEach((hex, i) => {
      let byte = parseInt(hex, 10)
      let errorId = []
      html += `<tr><td>${5 + i}</td>`
      html += `<td>${byte.toString(2).padStart(8, '0')}</td>`

      for (let right = 0; right < 8; right++) {
        const bit = (byte >> right) & 1
        if (bit === 1) {
          errorId.push(right + 1 + i * 8)
        }
      }
      if (errorId.length) {
        html += `<td>${errorId.join(', ')}</td>`
      } else {
        html += `<td>無異常</td>`
      }
    })
    html += '</tr></tbody></table>'
    return html

  }


  /**
  * 8-10 為 PowerMeterError 異常判斷
 */
  PowerMeterErrorCheck() {
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th colspan="3">PowerMeterError220 </br>byte 8-10</th></tr><tbody><tr>
      <thead><tr><th>Byte</th><th>bit</th><th>異常ID</th></tr><tbody><tr>`

    this.bytes.slice(8, 11).forEach((hex, i) => {
      let byte = parseInt(hex, 10)
      let errorId = []
      html += `<tr><td>${8 + i}</td>`
      html += `<td>${byte.toString(2).padStart(8, '0')}</td>`

      for (let right = 0; right < 8; right++) {
        const bit = (byte >> right) & 1
        if (bit === 1) {
          errorId.push(right + 1 + i * 8)
        }
      }
      if (errorId.length) {
        html += `<td>${errorId.join(', ')}</td>`
      } else {
        html += `<td>無異常</td>`
      }
    })

    html += '</tr></tbody></table>'
    return html

  }


  /**
   * 10-12 為 PowerMeterError110V 異常判斷
  */
  PowerMeterError110VCheck() {
    let html = `<table class="table table-success table-striped mx-2">
      <thead><tr><th colspan="3">PowerMeterError110 </br>byte 11-13</th></tr><tbody><tr>
      <thead><tr><th>Byte</th><th>bit</th><th>異常ID</th></tr><tbody><tr>`

    this.bytes.slice(11, 14).forEach((hex, i) => {
      let byte = parseInt(hex, 10)
      let errorId = []
      html += `<tr><td>${11 + i}</td>`
      html += `<td>${byte.toString(2).padStart(8, '0')}</td>`

      for (let right = 0; right < 8; right++) {
        const bit = (byte >> right) & 1
        if (bit === 1) {
          errorId.push(right + 1 + i * 8)
        }
      }
      if (errorId.length) {
        html += `<td>${errorId.join(', ')}</td>`
      } else {
        html += `<td>無異常</td>`
      }
    })
    html += '</tr></tbody></table>'
    return html

  }

  /**
   * 15-24 為房間資訊
   * 15為220模式
   * 16為110模式
   * 17-20為220度數
   * 21-24為110度數
   * 
  */
  userInfo() {
    let html = `<table class="table table-success table-striped align-self-start">
    <thead><tr><th>220模式Byte15</th><th>110模式 Byte16</th><th>220度數 Byte17-20</th><th>110度數 Byte 21-24</th></tr><tbody>`
    const mode220 = roomModeHash[parseInt(this.bytes[15], 10)]
    const mode110 = roomModeHash[parseInt(this.bytes[16], 10)]
    const watt220 = this.Bdegree_to_degree(this.bytes.slice(17, 21).reverse())
    const watt110 = this.Bdegree_to_degree(this.bytes.slice(21, 25).reverse())
    html += `<tr><td>${mode220}</td><td>${mode110}</td><td>${watt220}</td><td>${watt110}</td></tr>`

    html += `<tbody></table>`
    return html
  }

  /**
   * 25以後為其他meter更新
  */
  roomUpdateDate() {
    let column1 = '<td>Byte</td>'
    let column2 = '<td>更新</td>'
    let column3 = '<td>bit</td>'
    let column4 = '<td>更新資訊</td>'
    let thead = '<td>房間</td>'
    const roomMax = parseInt(this.bytes[4], 10);
    this.bytes.slice(25, 25 + roomMax).forEach((byte, i) => {
      thead += `<td>${i + 1}</td>`
      const byteDec = parseInt(byte, 10)
      let text = ''
      if ((byteDec >> 0 & 1) === 1) {
        text += ' 度數變更</br>'
      }
      if ((byteDec >> 1 & 1) === 1) {
        text += ' 模式變更</br>'
      }
      if ((byteDec >> 2 & 1) === 1) {
        text += ' MODE_RCD</br>'
      }
      if ((byteDec >> 3 & 1) === 1) {
        text += ' PWR_METER</br>'
      }
      if (byteDec === 0) {
        column2 += `<td>X</td>`
      }
      else {
        column2 += `<td>O</td>`
      }
      column1 += `<td>${25 + i}</td>`
      column3 += `<td>${byteDec.toString(2).padStart(4, '0')}</td>`
      column4 += `<td>${text}</td>`
    })

    let html = `<table class="table table-success table-striped mx-3 align-self-start">
      <thead><tr><th colspan="${roomMax + 1}">房間資料更新Byte 25-${25 + roomMax - 1}</th></tr><tbody>
      <tr>${thead}</tr><tr>${column1}</tr><tr>${column2}</tr><tr>${column3}</tr><tr>${column4}</tr></tbody></table>`
    return html
  }

  createHtml() {
    const byte14Dec = parseInt(this.bytes[14], 10);
    const byte4Dec = parseInt(this.bytes[4], 10);

    let html = `
        <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>MeterID(Byte14) : ${byte14Dec}</p>
        <p>Room Max(Byte4) : ${byte4Dec}</p>`)}
        `


    html += this.meterBoardErrorCheck()
    html += this.PowerMeterErrorCheck()
    html += this.PowerMeterError110VCheck()
    html += this.userInfo()
    html += this.roomUpdateDate()

    html += `</div></div> `
    return html
  }
}


/**
 * RSP 讀取房間(110/220)度數資訊一次5間
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
      <thead><tr><th>房間ID</th><th>220瓦特</th><th>byte</th><th>110瓦特</th><th>byte</th></tr></thead><tbody>`

    let curr = 6
    for (let i = 0; i < 5; i++) {
      const watt220 = this.Bdegree_to_degree(this.bytes.slice(curr, curr + 4))
      const watt220byte = `${curr}-${curr + 3}`
      curr += 4
      const watt110 = this.Bdegree_to_degree(this.bytes.slice(curr, curr + 4))
      const watt110byte = `${curr}-${curr + 3}`
      curr += 4
      html += `<tr><td>${i + 1 + byte5Dec * 5}</td><td>${watt220}</td><td>${watt220byte}</td><td>${watt110}</td>
               <td>${watt110byte}</td></tr>`
    }
    html += '</tbody></table>'
    return html
  }

  createHtml() {
    const byte4Dec = parseInt(this.bytes[4], 10);
    const byte5Dec = parseInt(this.bytes[5], 10);

    let html = `
      <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
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
        <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
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
    console.log(parseInt(this.bytes.slice(18, 22).join(''), 10));

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
        <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
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
 * 讀取名單資訊一次5個人
 */
class Mode53Parser extends ModeParser {
  /**
   * - 6以後為住宿者資料共5個每個佔9byte，以6為範例
   * - 6為模式
   * - 7-10為UID
   * - 11-14為餘額
  */
  userInfo() {
    let html = `<table class="table table-success table-striped">
    <thead><tr><th>學生ID</th><th>送電狀態</th><th>Byte</th><th>UID</th><th>Byte</th><th>餘額</th><th>Byte</th></tr><tbody>`

    let curr = 6
    for (let i = 0; i < 5; i++) {
      const id = i + parseInt(this.bytes[5], 10) * 5 + 1
      const mode = userModeHash[parseInt(this.bytes[curr + i * 9], 10) & 1]
      const modeByte = curr
      curr += 1
      const uid = this.Bidcard_to_str(this.bytes.slice(curr, curr + 4))
      const uidByte = `${curr} - ${curr + 3}`
      curr += 4
      const balance = this.Bbalance_to_str(this.bytes.slice(curr, curr + 4))
      const balanceByte = `${curr} - ${curr + 3}`
      curr += 4
      html += `<tr><td>${id}</td><td>${mode}</td><td>${modeByte}</td><td>${uid}</td><td>${uidByte}</td><td>${balance}</td><td>${balanceByte}</td></tr>`
    }
    html += `<tbody></table>`
    return html
  }

  createHtml() {
    const byte4Dec = parseInt(this.bytes[4], 10);
    const byte5Dec = parseInt(this.bytes[5], 10);

    let html = `
      <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
      <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
      <div class="card-body d-flex text-nowrap">${this.titleHtml(`<p>Meter ID : ${byte4Dec}</p><p> 封包號碼(byte5) : ${byte5Dec}</p>`)}
      `

    html += this.userInfo()
    html += `</div></div> `
    return html
  }
}

/**
 * RSP 整層模式
 */
class Mode57Parser extends ModeParser {


  /**
   * 5以後為房間資訊
   * 
  */
  roomInfo() {
    let html = `<table class="table table-success table-striped mx-3 align-self-start">
    <thead><tr><th>房間ID</th><th>220模式</th><th>220模式Byte</th><th>110模式</th><th>110模式Byte</th></tr><tbody>`
    for (let i = 0; i < 8; i++) {
      const mode220 = roomModeHash[parseInt(this.bytes[5 + i * 2], 10)] || roomModeHash['error'](parseInt(this.bytes[5 + i * 2], 10))
      const mode110 = roomModeHash[parseInt(this.bytes[6 + i * 2], 10)] || roomModeHash['error'](parseInt(this.bytes[6 + i * 2], 10))
      html += `<tr><td>${i + 1}</td><td>${mode220}</td><td>${5 + i * 2}</td><td>${mode110}</td><td>${6 + i * 2}</td>`
    }

    html += `<tbody></table>`
    html += `<table class="table table-success table-striped mx-3 align-self-start">
    <thead><tr><th>房間ID</th><th>220模式</th><th>220模式Byte</th><th>110模式</th><th>110模式Byte</th></tr><tbody>`

    for (let i = 8; i < 16; i++) {
      const mode220 = roomModeHash[parseInt(this.bytes[5 + i * 2], 10)] || roomModeHash['error'](parseInt(this.bytes[5 + i * 2], 10))
      const mode110 = roomModeHash[parseInt(this.bytes[6 + i * 2], 10)] || roomModeHash['error'](parseInt(this.bytes[6 + i * 2], 10))
      html += `<tr><td>${i + 1}</td><td>${mode220}</td><td>${5 + i * 2}</td><td>${mode110}</td><td>${6 + i * 2}</td>`
    }

    html += `<tbody></table>`
    html += `<table class="table table-success table-striped mx-3 align-self-start">
    <thead><tr><th>房間ID</th><th>220模式</th><th>220模式Byte</th><th>110模式</th><th>110模式Byte</th></tr><tbody>`

    for (let i = 16; i < maxRoom; i++) {
      const mode220 = roomModeHash[parseInt(this.bytes[5 + i * 2], 10)] || roomModeHash['error'](parseInt(this.bytes[5 + i * 2], 10))
      const mode110 = roomModeHash[parseInt(this.bytes[6 + i * 2], 10)] || roomModeHash['error'](parseInt(this.bytes[6 + i * 2], 10))
      html += `<tr><td>${i + 1}</td><td>${mode220}</td><td>${5 + i * 2}</td><td>${mode110}</td><td>${6 + i * 2}</td>`
    }

    html += `<tbody></table>`



    return html
  }

  /**
   * 25以後為其他meter更新
  */
  roomUpdateDate() {
    let column1 = '<td>更新</td>'
    let column2 = '<td>Byte</td>'
    let thead = '<td>房間</td>'
    this.bytes.slice(25, 19 + maxRoom).forEach((byte, i) => {
      thead += `<td>${i + 1}</td>`
      if ((parseInt(byte, 10) & 1) === 1) {
        column1 += `<td>O</td>`
      } else {
        column1 += `<td>X</td>`
      }
      column2 += `<td>${25 + i}</td>`
    })
    let html = `<table class="table table-success table-striped mx-3 align-self-start">
      <thead><tr><th colspan="${maxRoom + 1}">房間資料更新Byte 25-${25 + maxRoom - 1}</th></tr><tbody>
      <tr>${thead}</tr><tr>${column2}</tr><tr>${column1}</tr></tbody></table>`
    return html
  }

  createHtml() {
    const byte14Dec = parseInt(this.bytes[14], 10);

    let html = `
        <div class="card position-absolute d-flex parser d-none" id="parser${this.textList[0]}">
        <button type="button" class="btn-close ms-auto btn-parser-close" aria-label="Close"></button>
        <div class="card-body d-flex text-nowrap">${this.titleHtml()}
        `

    html += this.roomInfo()

    html += `</div></div> `
    return html
  }
}


let modeParser = {
  '17': Mode17Parser,
  '18': Mode18Parser,
  '19': Mode19Parser,
  '20': Mode20Parser,
  '49': Mode49Parser,
  '50': Mode50Parser,
  '51': Mode51Parser,
  '52': Mode52Parser,
  '53': Mode53Parser,
  '57': Mode57Parser,
}