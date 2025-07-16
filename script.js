// **NEW**: Add this at the top of your script.js
const EXTENSION_ID = 'kaiemldppikgjhonkcenekgnenkamkle';

// Core DOM elements
const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const uploadOverlay = document.getElementById('uploadOverlay');
const canvasWrapper = document.getElementById('canvasWrapper');
const aspectRatio = document.getElementById('aspectRatio');
const backgroundSizeInput = document.getElementById('backgroundSize');
const bgCornerRadius = document.getElementById('bgCornerRadius');
const shadowIntensity = document.getElementById('shadowIntensity');
const cropIntensity = document.getElementById('cropIntensity');

// Global state variables
let image = new Image();
let isBlurMode = false;
let blurObjects = [];
let selectedBlur = null;
let textObjects = [];
let selectedText = null;
let isTextMode = false;

// Initialize canvas
canvas.width = 400;
canvas.height = 300;


// **MODIFIED**: Load the image from the URL hash when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Check the URL hash for image data
  if (window.location.hash) {
    // The dataUrl is the hash, minus the '#' symbol
    const dataUrl = window.location.hash.substring(1);
    
    if (dataUrl.startsWith('data:image')) {
      image.src = dataUrl;
      image.onload = () => {
        drawImageWithEffects();
        uploadOverlay.classList.add('hidden');
      };
      // Clear the hash to keep the URL clean
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  }

  // Initialize text editing functionalities
  if (typeof initTextEditing === 'function') {
    initTextEditing();
  }

  // **NEW**: Add event listener for a new "Save to Extension" button
  const saveToExtBtn = document.getElementById('saveToExtensionBtn');
  if (saveToExtBtn) {
    saveToExtBtn.addEventListener('click', saveToExtensionHistory);
  }
});


// Reset canvas function
function resetCanvas() {
  uploadOverlay.classList.remove('hidden');
  image = new Image();
  drawImageWithEffects();
}

uploadOverlay.addEventListener('click', () => imageInput.click());

// Drag and drop handling
canvasWrapper.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadOverlay.style.backgroundColor = "rgba(0,123,255,0.2)";
});
canvasWrapper.addEventListener('dragleave', (e) => {
  e.preventDefault();
  uploadOverlay.style.backgroundColor = "rgba(255,255,255,0.8)";
});
canvasWrapper.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadOverlay.style.backgroundColor = "rgba(255,255,255,0.8)";
  const file = e.dataTransfer.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      image.src = event.target.result;
      image.onload = () => {
        drawImageWithEffects();
        history = [];
        currentState = -1;
        uploadOverlay.classList.add('hidden');
      };
    };
    reader.readAsDataURL(file);
  }
});

// **NEW**: Function to send the processed image back to the extension
async function saveToExtensionHistory() {
  if (!EXTENSION_ID || EXTENSION_ID === 'kaiemldppikgjhonkcenekgnenkamkle') {
    alert('Extension ID is not configured in the script.js file.');
    return;
  }

  const processedDataUrl = canvas.toDataURL('image/png');
  
  chrome.runtime.sendMessage(
    EXTENSION_ID, 
    {
      action: 'saveToHistory',
      processedDataUrl: processedDataUrl
    },
    function(response) {
      const saveBtn = document.getElementById('saveToExtensionBtn');
      if (response && response.success) {
        console.log('Successfully saved to extension history.');
        saveBtn.textContent = 'Saved!';
        setTimeout(() => { saveBtn.textContent = 'Save to Extension'; }, 2000);
      } else {
        console.error('Failed to save to extension:', response?.error || 'No response');
        alert('Could not save to extension. Make sure the extension is installed and the ID is correct.');
        saveBtn.textContent = 'Error!';
        setTimeout(() => { saveBtn.textContent = 'Save to Extension'; }, 2000);
      }
    }
  );
}


// Core image rendering function (No changes needed inside this function)
function drawImageWithEffects() {
    // ... (Your existing drawImageWithEffects function remains exactly the same)
    if (typeof updateImageTransformData === 'function') {
        updateImageTransformData();
    }
    if (!image.src) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!window.isTransparentBackground) {
            let gradient;
            const gradientAngle = window.gradientAngle || 135;
            if (document.getElementById('gradientType').value === 'radial') {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const radius = Math.max(canvas.width, canvas.height) / 2;
                gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            } else {
                const angleRad = (gradientAngle * Math.PI) / 180;
                const gradientSize = Math.max(canvas.width, canvas.height);
                const startX = canvas.width / 2 - Math.cos(angleRad) * gradientSize / 2;
                const startY = canvas.height / 2 - Math.sin(angleRad) * gradientSize / 2;
                const endX = canvas.width / 2 + Math.cos(angleRad) * gradientSize / 2;
                const endY = canvas.height / 2 + Math.sin(angleRad) * gradientSize / 2;
                gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            }
            gradient.addColorStop(0, document.getElementById('color1').value);
            gradient.addColorStop(1, document.getElementById('color2').value);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (typeof drawAllTexts === 'function') {
            drawAllTexts();
        }
        if (typeof drawAllShapes === 'function') {
            drawAllShapes();
        }
        return;
    }
    const bgRadius = parseInt(bgCornerRadius.value);
    const backgroundSize = parseInt(backgroundSizeInput.value);
    const selectedAspectRatio = aspectRatio.value;
    const shadowValue = parseInt(shadowIntensity.value);
    const cropPercent = parseInt(cropIntensity.value);
    let baseCanvasWidth, baseCanvasHeight;
    switch (selectedAspectRatio) {
        case 'auto':
            baseCanvasWidth = image.width;
            baseCanvasHeight = image.height;
            break;
        case 'square':
            baseCanvasWidth = baseCanvasHeight = Math.max(image.width, image.height);
            break;
        case 'horizontal':
            baseCanvasWidth = Math.max(image.width, (image.height * 16) / 9);
            baseCanvasHeight = (baseCanvasWidth * 9) / 16;
            break;
        case 'vertical':
            baseCanvasHeight = Math.max(image.height, (image.width * 16) / 9);
            baseCanvasWidth = (baseCanvasHeight * 9) / 16;
            break;
        case '4:3':
            baseCanvasWidth = Math.max(image.width, (image.height * 4) / 3);
            baseCanvasHeight = (baseCanvasWidth * 3) / 4;
            break;
        case '3:2':
            baseCanvasWidth = Math.max(image.width, (image.height * 3) / 2);
            baseCanvasHeight = (baseCanvasWidth * 2) / 3;
            break;
        case '2:1':
            baseCanvasWidth = Math.max(image.width, image.height * 2);
            baseCanvasHeight = baseCanvasWidth / 2;
            break;
        case '21:9':
            baseCanvasWidth = Math.max(image.width, (image.height * 21) / 9);
            baseCanvasHeight = (baseCanvasWidth * 9) / 21;
            break;
        case '3:4':
            baseCanvasHeight = Math.max(image.height, (image.width * 4) / 3);
            baseCanvasWidth = (baseCanvasHeight * 3) / 4;
            break;
        case '2:3':
            baseCanvasHeight = Math.max(image.height, (image.width * 3) / 2);
            baseCanvasWidth = (baseCanvasHeight * 2) / 3;
            break;
        case 'instagram':
            baseCanvasWidth = Math.max(image.width, (image.height * 4) / 5);
            baseCanvasHeight = (baseCanvasWidth * 5) / 4;
            break;
        case 'facebook':
            baseCanvasWidth = Math.max(image.width, (image.height * 1.91));
            baseCanvasHeight = baseCanvasWidth / 1.91;
            break;
        default:
            baseCanvasWidth = image.width;
            baseCanvasHeight = image.height;
    }
    const paddingAmount = Math.round((backgroundSize / 100) * Math.min(baseCanvasWidth, baseCanvasHeight));
    canvas.width = Math.round(baseCanvasWidth + (paddingAmount * 2));
    canvas.height = Math.round(baseCanvasHeight + (paddingAmount * 2));
    if (typeof updateImageTransformData === 'function') {
        updateImageTransformData();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!window.isTransparentBackground) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bgRadius, 0);
        ctx.lineTo(canvas.width - bgRadius, 0);
        ctx.arcTo(canvas.width, 0, canvas.width, bgRadius, bgRadius);
        ctx.lineTo(canvas.width, canvas.height - bgRadius);
        ctx.arcTo(canvas.width, canvas.height, canvas.width - bgRadius, canvas.height, bgRadius);
        ctx.lineTo(bgRadius, canvas.height);
        ctx.arcTo(0, canvas.height, 0, canvas.height - bgRadius, bgRadius);
        ctx.lineTo(0, bgRadius);
        ctx.arcTo(0, 0, bgRadius, 0, bgRadius);
        ctx.closePath();
        ctx.clip();
        let gradient;
        const gradientAngle = window.gradientAngle || 135;
        if (document.getElementById('gradientType').value === 'radial') {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.max(canvas.width, canvas.height) / 2;
            gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        } else {
            const angleRad = (gradientAngle * Math.PI) / 180;
            const gradientSize = Math.max(canvas.width, canvas.height);
            const startX = canvas.width / 2 - Math.cos(angleRad) * gradientSize / 2;
            const startY = canvas.height / 2 - Math.sin(angleRad) * gradientSize / 2;
            const endX = canvas.width / 2 + Math.cos(angleRad) * gradientSize / 2;
            const endY = canvas.height / 2 + Math.sin(angleRad) * gradientSize / 2;
            gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        }
        gradient.addColorStop(0, document.getElementById('color1').value);
        gradient.addColorStop(1, document.getElementById('color2').value);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    const offsetX = Math.round(paddingAmount + (baseCanvasWidth - image.width) / 2);
    const offsetY = Math.round(paddingAmount + (baseCanvasHeight - image.height) / 2);
    const cropWidth = (cropPercent / 100) * image.width;
    const cropHeight = (cropPercent / 100) * image.height;
    const sourceWidth = image.width - 2 * cropWidth;
    const sourceHeight = image.height - 2 * cropHeight;
    if (shadowValue > 0) {
        ctx.save();
        ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(shadowValue / 30, 0.7)})`;
        ctx.shadowBlur = shadowValue;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = `rgb(${paddingColor.r}, ${paddingColor.g}, ${paddingColor.b})`;
        if (window.mask && window.mask.type !== 'none') {
            if (typeof applyShadowMask === 'function') {
                const hasMaskShadow = applyShadowMask(ctx, offsetX, offsetY, image.width, image.height);
                if (hasMaskShadow) {
                    ctx.fill();
                }
            }
        } else {
            ctx.beginPath();
            ctx.rect(offsetX, offsetY, image.width, image.height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.save();
    if (window.mask && window.mask.type !== 'none') {
        if (typeof applyMask === 'function') {
            applyMask(ctx, offsetX, offsetY, image.width, image.height);
        }
    }
    ctx.drawImage(image, cropWidth, cropHeight, sourceWidth, sourceHeight, offsetX, offsetY, image.width, image.height);
    ctx.restore();
    if (typeof drawMaskBorder === 'function') {
        drawMaskBorder(ctx, offsetX, offsetY, image.width, image.height);
    }
    if (typeof drawAllTexts === 'function') {
        drawAllTexts();
    }
    if (blurObjects && blurObjects.length > 0) {
        window.applyBlurEffects();
    }
    if (isBlurMode) {
        setTimeout(drawAllBlurs, 0);
    }
    if (typeof drawAllShapes === 'function') {
        drawAllShapes();
    }
}


// Event listeners for core controls (No changes needed)
backgroundSizeInput.addEventListener('input', drawImageWithEffects);
bgCornerRadius.addEventListener('input', drawImageWithEffects);
aspectRatio.addEventListener('change', drawImageWithEffects);
shadowIntensity.addEventListener('input', drawImageWithEffects);
cropIntensity.addEventListener('input', drawImageWithEffects);
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            image.src = event.target.result;
            image.onload = () => {
                drawImageWithEffects();
                history = [];
                currentState = -1;
                uploadOverlay.classList.add('hidden');
            };
        };
        reader.readAsDataURL(file);
    }
});

// Copy image to clipboard function (No changes needed)
async function copyImageToClipboard() {
    try {
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });
        const clipboardItem = new ClipboardItem({
            'image/png': blob
        });
        await navigator.clipboard.write([clipboardItem]);
        const copyBtn = document.getElementById('copyBtn');
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyBtn.style.color = '#28a745';
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.color = '';
        }, 1500);
    } catch (err) {
        console.error('Failed to copy image to clipboard:', err);
        const copyBtn = document.getElementById('copyBtn');
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-times"></i>';
        copyBtn.style.color = '#dc3545';
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.color = '';
        }, 1500);
    }
}

// Add event listener for the copy button (No changes needed)
document.addEventListener('DOMContentLoaded', function() {
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyImageToClipboard);
  }
});
