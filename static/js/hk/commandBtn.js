const command_btns = document.querySelectorAll(".command_btn");
const PORT = location.port || 3000
command_btns.forEach((btn) => {
  btn.addEventListener("click", () => {
    fetchCommand(btn.id)
  })
})

const command_btn = document.querySelector(".swal_btn");

command_btn.addEventListener("click", () => {
  Swal.fire({
    title: '請輸入以讀取紀錄數量',
    input: 'text',
    inputValue: '0',
  }).then((result) => {
    if (result.value) {
      // 使用者點擊了確定按鈕，result.value 將包含輸入的值
      fetchCommand(command_btn.id + ` -r ${result.value}`)
    }
  })

})

const fetchCommand = (cmd) => {
  fetch(`http://localhost:${PORT}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file: cmd })
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