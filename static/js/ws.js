const socket = new WebSocket('ws://localhost:5000');
socket.onmessage = function (event) {
  try {
    json_date = JSON.parse(event.data)
    if (json_date['new_log']) {
      json_date['new_log'].unshift(initialData.length+1)
      str_list = json_date['new_log'].map(num => num.toString())
      initialData.push(str_list)
      addTable(initialData)
      addParsesEvent()
      addDecEvent()
    }
  } catch (error) {
    console.log("error:", error);
  }

};
