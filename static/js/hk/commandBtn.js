const command_btns = document.querySelectorAll(".command_btn");
const PORT = 3000
command_btns.forEach((btn) => {
  btn.addEventListener("click", () => {
    fetch(`http://localhost:${PORT}/command`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ file: btn.id }) 
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
  });
});
