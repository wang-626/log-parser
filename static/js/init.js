const modelBody = document.querySelector('.modal-body')

let html = ''
for (let i = 1; i < 8; i++) {
  html += '<div class="d-flex">'
  for (let ii = 1; ii < 9; ii++) {
    let number = ii + (8 * (i - 1)) - 1
    html += `<div class="form-check me-3">
             <input class="form-check-input table-check" type="checkbox" value="" id="t${number}Check" checked>
             <label class="form-check-label" for="t${number}Check">
              ${number}
             </label>
             </div>`
  }
  html += '</div>'
}

modelBody.innerHTML = html