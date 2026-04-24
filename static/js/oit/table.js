class Table {
  constructor() {
    this.theadhName = { 1: 'CenterId', 2:'mode' };
  }
}

class Table1A {
  constructor() {
    this.theadhName = { 1: 'mode', 2: 'CenterId' };
  }
}


const thead = document.querySelector('.thead')

const createTable = (tableClass) => {
  let table = new tableClass()
  let html = '<tr class="table-dark sticky-top"><th class=""></th><th class="time">時間</th>'
  for (let i = 0; i < 100; i++) {
    html += ` 
        <th class="t${i}">${table.theadhName[i] || i }</th>
        `
  }
  html += ' </tr>'
  thead.innerHTML = html
}

createTable(Table)

