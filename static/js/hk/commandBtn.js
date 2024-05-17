const command_btns = document.querySelectorAll(".command_btn");
const meter = document.querySelector("#meter-id");
const PORT = location.port || 3000
command_btns.forEach((btn) => {
  btn.addEventListener("click", () => {
    fetchCommand(btn.id, True)
  })
})

const alive_btn = document.querySelector(".alive_btn");
const hardware_set_btn = document.querySelector(".hardware_set_btn");

alive_btn.addEventListener("click", () => {
  Swal.fire({
    title: '請輸入以讀取紀錄數量',
    html: `
    <div>
    <input id="read_count" type="number" class="swal2-input" value=0>
    </div>
    <div class="m-3"> 
    <label for="open_door">是否開門?</label>
    <input id="open_door" type="checkbox">
    </div>
  `,
    focusConfirm: false,
    preConfirm: () => {
      return [
        document.getElementById("read_count").value,
        document.getElementById("open_door").checked
      ];
    }
  }).then((result) => {
    if (result.value) {
      console.log(result.value[1]);
      fetchCommand(alive_btn.id + ` -r ${result.value[0]}`, result.value[1])
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
      cmd = result.value[0] || 0
      cmd_arg = result.value[1] || 0
      fetchCommand(hardware_set_btn.id + ` -c ${cmd} -a ${cmd_arg}`)
    }
  })
})

const fetchCommand = (cmd, cmd_meter_id) => {
  if (cmd_meter_id) {
    cmd = cmd + ` -meter ${meter.value}`
  }

  fetch(`http://localhost:${PORT}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cmd: cmd })
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