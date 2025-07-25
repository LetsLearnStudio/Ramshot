//historyManagement.js
  let actionHistory = [];
let currentState = -1;

function saveState() {
  if (actionHistory.length >= 10) actionHistory.shift();
  const state = {
    canvasData: canvas.toDataURL(),
    blurObjects: JSON.parse(JSON.stringify(blurObjects))
  };
  actionHistory.push(state);
  currentState = actionHistory.length - 1;
}

function undo() {
  if (currentState > 0) {
    currentState--;
    const state = actionHistory[currentState];
    const img = new Image();
    img.src = state.canvasData;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      blurObjects = JSON.parse(JSON.stringify(state.blurObjects));
      if (isBlurMode) drawAllBlurs();
    };
  }
}

function redo() {
  if (currentState < actionHistory.length - 1) {
    currentState++;
    const state = actionHistory[currentState];
    const img = new Image();
    img.src = state.canvasData;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      blurObjects = JSON.parse(JSON.stringify(state.blurObjects));
      if (isBlurMode) drawAllBlurs();
    };
  }
}

// Updated downloadImage function to save processed image to history
function downloadImage() {
  // Temporarily clear the selected blur to hide selection handles
  const tempSelectedBlur = selectedBlur;
  selectedBlur = null;
  
  // Redraw without selection handles
  drawImageWithEffects();
  if (isBlurMode) {
    drawAllBlurs();
  }
  
  // Get the processed image data
  const processedDataUrl = canvas.toDataURL();
  
  // Create download link
  const link = document.createElement('a');
  link.download = 'RamaScreenshot.png';
  link.href = processedDataUrl;
  link.click();
  
  // Save the processed image to history
  chrome.runtime.sendMessage(window.EXTENSION_ID, {
    action: 'saveToHistory',
    processedDataUrl: processedDataUrl
  }, function(response) {
    if (response && response.error) {
      console.error('Failed to save to history:', response.error);
    }
  });
  
  // Restore the selected blur state
  selectedBlur = tempSelectedBlur;
  
  // Redraw with selection handles if needed
  if (selectedBlur) {
    drawImageWithEffects();
    drawAllBlurs();
  }
}

function resetCanvas() {
  blurObjects = [];
  selectedBlur = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  image = new Image();
  uploadOverlay.classList.remove('hidden');
  imageInput.value = '';
  canvas.width = 400;
  canvas.height = 300;
  
  // Reset controls
  document.getElementById('color1').value = "#3498db";
  document.getElementById('color2').value = "#9b59b6";
  cornerRadius.value = 0;
  backgroundSizeInput.value = 20;
  aspectRatio.value = "original";
  bgCornerRadius.value = 0;
  document.getElementById('blurToggle').checked = false;
  document.getElementById('blurIntensity').value = 5;
  document.getElementById('shape').value = "rectangle";
  shadowIntensity.value = 0;
  document.getElementById('gradientType').value = "linear";
  cropIntensity.value = 0;
  
  document.getElementById("blurIntensityDiv").style.display = "none";
  document.getElementById("shapeDiv").style.display = "none";
  
  actionHistory = [];
  currentState = -1;
  drawImageWithEffects();
}
