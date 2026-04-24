const startDragging = (event) => {
  event.preventDefault();
  const draggableDiv = event.target;
  const container = draggableDiv.parentElement;
  const containerRect = container.getBoundingClientRect();
  const offsetX = event.clientX - draggableDiv.offsetLeft;
  
  function onMouseMove(event) {
    console.log("move");
    const x = event.clientX - offsetX;
    
    const minX = 0;
    const maxX = containerRect.width - draggableDiv.offsetWidth;
    
    const clampedX = Math.min(Math.max(x, minX), maxX);
    
    draggableDiv.style.left = clampedX + "px";
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}