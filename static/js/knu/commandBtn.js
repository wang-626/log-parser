const command_btns = document.querySelectorAll(".command_btn");
const alive_btn = document.querySelector(".alive_btn");
const PORT = location.port || 3000

let id_card = localStorage.getItem('id_card') || 1234567890
let is_pass = localStorage.getItem('is_pass') || false

command_btns.forEach((btn) => {
  btn.addEventListener("click", () => {
    fetchCommand(btn.id.replace('test_', ''))
  })
})

alive_btn.addEventListener("click", () => {
  Swal.fire({
    title: '請輸入命令和參數',
    html: `
    <div>
    <label for="id_card">卡號</label>
    <input id="id_card" type="number" class="swal2-input" value=${id_card}>
    </div>
    <div>
    <label for="is_pass">是否通過</label>
    <input id="is_pass" type="checkbox" ${is_pass ? 'checked' : ''}>
    </div>
  `,
    preConfirm: () => {
      return [
        document.getElementById("id_card").value,
        document.getElementById("is_pass").checked
      ];
    }
  }).then((result) => {
    if (result.value) {
      id_card = result.value[0] || 0
      is_pass = result.value[1] || false
      fetchCommand(alive_btn.id.replace('test_', ''), { id_card: Number(id_card), is_pass })
      if (id_card !== 0) {
        localStorage.setItem('id_card', id_card)
      }
      if (is_pass !== 0) {
        localStorage.setItem('is_pass', is_pass)
      }
    }
  })
})

const fetchCommand = (module, extraArgs = {}) => {
  fetch(`http://localhost:${PORT}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ module, args: extraArgs })
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.log(`Error: ${error}`);
    });
}
