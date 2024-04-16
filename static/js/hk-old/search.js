const addSearch = document.querySelector('.add-search')
const divCondition = document.querySelector('.div-condition')
const tooltip = document.querySelector('#tooltip');



addSearch.addEventListener('click', () => {
  let html = addConditionCard()
  divCondition.insertAdjacentHTML('beforeend', html)
  close()
  select()
})

const addConditionCard = () => {
  let count = divCondition.childElementCount + 1
  let html = `<div class="card m-3">
              <div class="d-flex justify-content-between flex-row-reverse">
              <button type="button" class="btn-close btn-search-close" aria-label="Close">
              </button>
              </div>
              <select class="form-select condition" id="condition-select-${count}">`
  for (let i = 1; i < 57; i++) {
    const displayName = (byteName[i].name !== undefined) ? byteName[i].name + ` (${i})` : i;
    html += `<option value='${i}'>${displayName} </option>`
  }
  html += `<div class="input-group mb-3">
          <input type="text" class="form-control" id="condition-value-${count}">
          </div>`
  html += '</div></select>'
  return html
}

const close = () => {
  const closeBtns = document.querySelectorAll('.btn-search-close')
  closeBtns.forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => {
      closeBtn.parentNode.parentNode.parentNode.removeChild(closeBtn.parentNode.parentNode);
    })
  })
}

const select = () => {
  const conditions = document.querySelectorAll('.condition')
  conditions.forEach((condition) => {
    condition.addEventListener('change', () => {
      const conditionId = condition.id.slice(17)
      const conditionValue = document.querySelector(`#condition-value-${conditionId}`)
      const systemLabel = document.querySelector(`label[for="dec-hex-switch-label-${conditionId}`)
      let html = ''
      if (byteName[condition.value].selectName) {
        html = createSelect(byteName[condition.value].selectName, conditionId);
      } else {
        html = `<input type="text" class="form-control" id="condition-value-${conditionId}"></input>`
      }
      conditionValue.parentNode.removeChild(conditionValue);
      condition.parentNode.insertAdjacentHTML('beforeend', html)
    })
  })
}

const createSelect = (hash, id) => {
  let html = `<select class="form-select" id="condition-value-${id}">`

  Object.keys(hash).forEach((key) => {
    html += `<option value="${key}">${hash[key]} (DEC:${key})</option>`
  })
  html += '</select>'

  return html
}