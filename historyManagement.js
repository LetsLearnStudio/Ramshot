// **MODIFIED**: Renamed 'history' to 'actionHistory' to avoid conflict
let actionHistory = [];
let currentState = -1;

const EXTENSION_ID = 'kaiemldppikgjhonkcenekgnenkamkle';

function saveState() {
  // **MODIFIED**: Use 'actionHistory'
  if (actionHistory.length >= 10) actionHistory.shift();
  
  const state = {
    canvasData: canvas.toDataURL(),
    blurObjects: JSON.parse(JSON.stringify(blurObjects))
  };
  
  // **MODIFIED**: Use 'actionHistory'
  actionHistory.push(state);
  currentState = actionHistory.length - 1;
}

function undo() {
  if (currentState > 0) {
    currentState--;
    // **MODIFIED**: Use 'actionHistory'
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
  // **MODIFIED**: Use 'actionHistory'
  if (currentState < actionHistory.length - 1) {
    currentState++;
    // **MODIFIED**: Use 'actionHistory'
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

function downloadImage() {
  const tempSelectedBlur = selectedBlur;
  selectedBlur = null;
  
  drawImageWithEffects();
  if (isBlurMode) {
    drawAllBlurs();
  }
  
  const processedDataUrl = canvas.toDataURL();
  
  const link = document.createElement('a');
  link.download = 'RamaScreenshot.png';
  link.href = processedDataUrl;
  link.click();
  
  if (!EXTENSION_ID || EXTENSION_ID === 'kaiemldppikgjhonkcenekgnenkamkle') {
      alert('Extension ID is not configured in historyManagement.js');
      return;
  }
  
  chrome.runtime.sendMessage(
    EXTENSION_ID,
    {
      action: 'saveToHistory',
      processedDataUrl: processedDataUrl
    }, 
    function(response) {
      if (response && response.error) {
        console.error('Failed to save to history:', response.error);
      } else {
        console.log('Successfully saved to extension history.');
      }
    }
  );
  
  selectedBlur = tempSelectedBlur;
  
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
  // cornerRadius is not defined, assuming it's a typo for bgCornerRadius
  // if you have an element with id 'cornerRadius', ensure it is handled correctly.
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
  
  // **MODIFIED**: Use 'actionHistory'
  actionHistory = [];
  currentState = -1;
  drawImageWithEffects();
}
