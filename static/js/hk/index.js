const readInput = document.querySelector('.read')
const tbody = document.querySelector(".tbody")
const tableChecks = document.querySelectorAll('.table-check')
const btnSearch = document.querySelector('.btn-search')
const countInput = document.querySelector('.count');
let initialData = []

let modeIndex = null;
for (const key in byteName) {
  if (byteName.hasOwnProperty(key)) {
    const element = byteName[key];
    if (element.name === 'mode') {
      modeIndex = Number(key) + 2;
      break;
    }
  }
}

if (modeIndex == null) {
  console.log("not found modeIndex");
}



readInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    initialData = textSplit(e.target.result)
    addTable(initialData)
    addParsesEvent()
  };
  reader.readAsText(file);
})


const textSplit = (text) => {
  texts = text.trim().split(/\r?\n/)
  texts = texts.map((line, i) => {
    const parts = line.split(" : ");
    textList = [i + 1, parts[0]]
    if (line.includes(',')) {
      textList = textList.concat(parts[1].split(', '))
    } else {
      textList = textList.concat(parts[1].split(' '))
    }
    textList[4] = textList[4] + '<br>' + (byte2Name[textList[4]] || "")
    return textList
  })

  return texts
}

const addTable = (data) => {
  let html = ''
  let count = -Number(countInput.value)
  data.slice(count).forEach(textList => {
    let modeId = 0
    if (typeof (textList[modeIndex]) == String) {
      modeId = textList[modeIndex].slice(0, 2)
    }
    else {
      modeId = String(textList[modeIndex]).slice(0, 2)
    }
    if (modeParser[modeId] !== undefined) {
      const parse = new modeParser[modeId](textList)
      html += '<tr>'
      textList.forEach((v, i) => {
        if (i === 0) {
          html += `<td class='t${i} '>
          ${v}
          <br>
          <button class="btn btn-primary parser-btn" type="button" id="parser-btn-${textList[0]}">
          解析
          </button></td>`
        } else {
          html += `<td class='t${i}'>${v}</td> `
        }
      })
      html += '</tr><tr>'
      html += `<td colspan="${dateLen}" class='hiddenRow'>${parse.createHtml()}</td>`
      html += '</tr>'
    } else {
      html += '<tr>'
      textList.forEach((v, i) => {
        html += `<td class='t${i}'>${v}</td>`
      })
      html += '</tr>'
    }
  });
  tbody.innerHTML = html
}

tableChecks.forEach((tableCheck) => {
  tableCheck.addEventListener('change', () => {
    let number = tableCheck.id.slice(1, -5);
    let elements = document.querySelectorAll(`.t${number}`);
    if (!tableCheck.checked) {
      elements.forEach((element) => {
        element.classList.add('d-none')
      })
    } else {
      elements.forEach((element) => {
        element.classList.remove('d-none')
      })
    }
  })
})


btnSearch.addEventListener('click', (e) => {
  const conditions = document.querySelectorAll(".condition")
  let byteConditionHash = {}
  conditions.forEach((condition) => {
    const conditionId = condition.id.slice(17)
    const conditionValue = document.querySelector(`#condition-value-${conditionId}`)
    let value = conditionValue.value.split(",") || [conditionValue.value]

    if (!byteConditionHash[condition.value]) {
      byteConditionHash[condition.value] = { "isEqual": [], "isNotEqual": [] }
    }
    value.forEach((v) => {
      if (v.includes("!")) {
        byteConditionHash[condition.value]["isNotEqual"].push(v.slice(1))
      } else {
        byteConditionHash[condition.value]["isEqual"].push(v)
      }
    })

  })

  let filterData = dataFilter(byteConditionHash)
  addTable(filterData)
  addParsesEvent()
})


const dataFilter = (hash) => {
  list = []
  list = initialData.filter((text) => {
    let result = true;
    const keysList = Object.keys(hash)

    for (let i = 0; i < keysList.length; i++) {
      const byteIndex = keysList[i]
      const DateByte = text[Number(byteIndex) + 2].slice(0, 2)

      if ((hash[byteIndex]["isEqual"].length !== 0) && !hash[byteIndex]["isEqual"].includes(DateByte)) {
        result = false
        break
      }

      if (hash[byteIndex]["isNotEqual"].includes(DateByte)) {
        result = false
        break
      }

    }

    return result
  })

  return list
}

const addParsesEvent = () => {
  const btnParses = document.querySelectorAll('.parser-btn')

  btnParses.forEach((btnParse) => {
    btnParse.addEventListener('click', (e) => {
      const id = btnParse.id.slice(11)
      const parseDiv = document.querySelector(`#parser${id}`)
      if (parseDiv.classList.contains("d-none")) {
        parseDiv.classList.remove('d-none')
      } else {
        parseDiv.classList.add('d-none')
      }
    })
  })

  const closeBtns = document.querySelectorAll('.btn-parser-close')
  closeBtns.forEach((closeBtn) => {
    closeBtn.addEventListener('click', (e) => {
      closeBtn.parentNode.classList.add('d-none')
    })
  })

  const parses = document.querySelectorAll('.parser')
  parses.forEach((parse) => {
    parse.addEventListener('dragstart', startDragging);
  })
}