const command_btns = document.querySelectorAll(".command_btn");
const meter = document.querySelector("#meter-id");
const center = document.querySelector("#center-id");
const alive_btn = document.querySelector(".alive_btn");
const hardware_set_btn = document.querySelector(".hardware_set_btn");

const PORT = location.port || 3000

let read_count = localStorage.getItem('read_count') || 0

meter.value = localStorage.getItem('meter_id') || 1
center.value = localStorage.getItem('center_id') || 1

command_btns.forEach((btn) => {
  btn.addEventListener("click", () => {
    fetchCommand(btn.id.replace('test_', ''))
  })
})
meter.addEventListener("blur", (e) => {
  localStorage.setItem('meter_id', e.target.value)
})
center.addEventListener("blur", (e) => {
  localStorage.setItem('center_id', e.target.value)
})


alive_btn.addEventListener("click", () => {
  Swal.fire({
    title: '請輸入以讀取紀錄數量',
    html: `
    <div>
    <input id="read_count" type="number" class="swal2-input" value=${read_count}>
    </div>
    <div class="m-3">
    <label for="open_door">是否開門?</label>
    <input id="open_door" type="checkbox">
    </div>
  `,
    focusConfirm: false,
    preConfirm: () => {
      localStorage.setItem('read_count', document.getElementById("read_count").value);
      read_count = document.getElementById("read_count").value
      return [
        document.getElementById("read_count").value,
        document.getElementById("open_door").checked
      ];
    }
  }).then((result) => {
    if (result.value) {
      fetchCommand('Alive', { r: Number(result.value[0]), open: result.value[1] })
    }
  })
})

hardware_set_btn.addEventListener("click", () => {
  Swal.fire({
    title: '請輸入命令和參數',
    html: `
    <div>
    <label for="cmd_input">命令</label>
    <input id="cmd_input" type="number" class="swal2-input" value=160>
    </div>
    <div>
    <label for="cmd_arg_input">參數</label>
    <input id="cmd_arg_input" type="number" class="swal2-input">
    </div>
  `,
    focusConfirm: false,
    preConfirm: () => {
      return [
        document.getElementById("cmd_input").value,
        document.getElementById("cmd_arg_input").value
      ];
    }
  }).then((result) => {
    if (result.value) {
      fetchCommand('SetHardware', { c: Number(result.value[0]) || 0, a: Number(result.value[1]) || 0 })
    }
  })
})

const fetchCommand = (module, extraArgs = {}) => {
  const args = { meter: Number(meter.value), center: Number(center.value), ...extraArgs }

  fetch(`http://localhost:${PORT}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ module, args })
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
