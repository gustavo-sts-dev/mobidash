const grid_container = document.querySelector(".grid");
let lastDocumentHeight = 0;
let lastWindowWidth = 0;
let isUpdating = false;

function getDocumentHeight() {
  return Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
}

function generateHorizontalLines() {
  const existingLines = grid_container.querySelectorAll(".horizontal-line");
  existingLines.forEach(line => line.remove());
  
  const documentHeight = getDocumentHeight();
  const linesNeeded = Math.ceil(documentHeight / 64) + 5;
  
  for (let n = 0; n < linesNeeded; n++) {
    const horizontal_line = document.createElement("div");
    horizontal_line.className = "horizontal-line";
    horizontal_line.style.top = `${64 * n}px`;
    grid_container.append(horizontal_line);
  }
  
  grid_container.style.height = `${documentHeight}px`;
  lastDocumentHeight = documentHeight;
}

function generateVerticalLines() {
  const existingLines = grid_container.querySelectorAll(".vertical-line");
  existingLines.forEach(line => line.remove());
  
  const documentHeight = getDocumentHeight();
  const windowWidth = window.innerWidth;
  const linesNeeded = Math.ceil(windowWidth / 64) + 2;
  
  for (let n = 0; n < linesNeeded; n++) {
    const vertical_line = document.createElement("div");
    vertical_line.className = "vertical-line";
    vertical_line.style.left = `${64 * n}px`;
    vertical_line.style.height = `${documentHeight}px`;
    grid_container.append(vertical_line);
  }
  
  grid_container.style.height = `${documentHeight}px`;
  lastDocumentHeight = documentHeight;
  lastWindowWidth = windowWidth;
}

function updateGrid() {
  if (isUpdating) return;
  
  isUpdating = true;
  
  const currentHeight = getDocumentHeight();
  const currentWidth = window.innerWidth;
  
  const heightChanged = Math.abs(currentHeight - lastDocumentHeight) > 100;
  const widthChanged = currentWidth !== lastWindowWidth;
  
  if (heightChanged || widthChanged) {
    generateHorizontalLines();
    generateVerticalLines();
  }
  
  isUpdating = false;
}

window.updateGrid = updateGrid;

updateGrid();

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateGrid();
  }, 250);
});

setInterval(() => {
  const currentHeight = getDocumentHeight();
  
  if (Math.abs(currentHeight - lastDocumentHeight) > 100) {
    updateGrid();
  }
}, 1000);
