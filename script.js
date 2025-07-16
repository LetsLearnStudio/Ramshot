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

// Text-related global variables - adding these to fix the error
let textObjects = [];
let selectedText = null;
let isTextMode = false;

// Initialize canvas
canvas.width = 400;
canvas.height = 300;


// Load the image from Chrome storage when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Get the image data from storage
  chrome.storage.local.get(['currentEditImage'], function(result) {
    if (result.currentEditImage) {
      // Load the image into the editor
      image.src = result.currentEditImage;
      image.onload = () => {
        drawImageWithEffects();
        uploadOverlay.classList.add('hidden');
      };
    }
  });

  // Initialize text editing functionalities
  if (typeof initTextEditing === 'function') {
    initTextEditing();
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

// Core image rendering function
function drawImageWithEffects() {
  // IMPORTANT: Update image transform data FIRST and ensure it's complete
  if (typeof updateImageTransformData === 'function') {
    updateImageTransformData();
  }
  
  if (!image.src) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Check for transparency flag
    if (!window.isTransparentBackground) {
      let gradient;
      
      // Use gradient angle from window.gradientAngle if available (set by colorGradient.js)
      const gradientAngle = window.gradientAngle || 135; // Default to 135 if not set
      
      if (document.getElementById('gradientType').value === 'radial') {
        const centerX = canvas.width/2;
        const centerY = canvas.height/2;
        const radius = Math.max(canvas.width, canvas.height)/2;
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      } else {
        // Calculate gradient start and end points based on angle
        const angleRad = (gradientAngle * Math.PI) / 180;
        const gradientSize = Math.max(canvas.width, canvas.height);
        
        // Calculate start and end points for the gradient
        const startX = canvas.width/2 - Math.cos(angleRad) * gradientSize/2;
        const startY = canvas.height/2 - Math.sin(angleRad) * gradientSize/2;
        const endX = canvas.width/2 + Math.cos(angleRad) * gradientSize/2;
        const endY = canvas.height/2 + Math.sin(angleRad) * gradientSize/2;
        
        gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      }
      
      gradient.addColorStop(0, document.getElementById('color1').value);
      gradient.addColorStop(1, document.getElementById('color2').value);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw any text objects if we have them, even without an image
    if (typeof drawAllTexts === 'function') {
      drawAllTexts();
    }
    // Ensure shapes are drawn even when no image is present
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

  // Calculate base canvas dimensions (without background scaling)
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

  // Calculate uniform padding for all sides based on backgroundSize
  // Use Math.round to avoid floating point precision issues
  const paddingAmount = Math.round((backgroundSize / 100) * Math.min(baseCanvasWidth, baseCanvasHeight));
  
  // Set final canvas dimensions with uniform padding
  canvas.width = Math.round(baseCanvasWidth + (paddingAmount * 2));
  canvas.height = Math.round(baseCanvasHeight + (paddingAmount * 2));
  
  // CRITICAL FIX: Update imageTransformData again after canvas dimensions are finalized
  // This ensures that text positioning calculations have the correct canvas dimensions
  if (typeof updateImageTransformData === 'function') {
    updateImageTransformData();
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background only if not transparent
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
    // Use gradient angle from window.gradientAngle if available (set by colorGradient.js)
    const gradientAngle = window.gradientAngle || 135; // Default to 135 if not set
    
    if (document.getElementById('gradientType').value === 'radial') {
      const centerX = canvas.width/2;
      const centerY = canvas.height/2;
      const radius = Math.max(canvas.width, canvas.height)/2;
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    } else {
      // Calculate gradient start and end points based on angle
      const angleRad = (gradientAngle * Math.PI) / 180;
      const gradientSize = Math.max(canvas.width, canvas.height);
      
      // Calculate start and end points for the gradient
      const startX = canvas.width/2 - Math.cos(angleRad) * gradientSize/2;
      const startY = canvas.height/2 - Math.sin(angleRad) * gradientSize/2;
      const endX = canvas.width/2 + Math.cos(angleRad) * gradientSize/2;
      const endY = canvas.height/2 + Math.sin(angleRad) * gradientSize/2;
      
      gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    }
    
    gradient.addColorStop(0, document.getElementById('color1').value);
    gradient.addColorStop(1, document.getElementById('color2').value);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // UNIFIED IMAGE POSITIONING: Always center the image with uniform padding
  // This ensures consistent positioning regardless of aspect ratio mode
  const offsetX = Math.round(paddingAmount + (baseCanvasWidth - image.width) / 2);
  const offsetY = Math.round(paddingAmount + (baseCanvasHeight - image.height) / 2);

  // Calculate crop dimensions
  const cropWidth = (cropPercent / 100) * image.width;
  const cropHeight = (cropPercent / 100) * image.height;
  const sourceWidth = image.width - 2 * cropWidth;
  const sourceHeight = image.height - 2 * cropHeight;

  // Draw shadow
  if (shadowValue > 0) {
    ctx.save();
    
    // Set shadow properties
    ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(shadowValue / 30, 0.7)})`;
    ctx.shadowBlur = shadowValue;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Use detected padding color instead of white
    ctx.fillStyle = `rgb(${paddingColor.r}, ${paddingColor.g}, ${paddingColor.b})`;
    
    // Check if we have a mask applied
    if (window.mask && window.mask.type !== 'none') {
      // Use mask shape for shadow
      if (typeof applyShadowMask === 'function') {
        const hasMaskShadow = applyShadowMask(ctx, offsetX, offsetY, image.width, image.height);
        if (hasMaskShadow) {
          ctx.fill();
        }
      }
    } else {
      // Use rectangular shadow (no rounded corners since we removed corner radius)
      ctx.beginPath();
      ctx.rect(offsetX, offsetY, image.width, image.height);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }

  // Draw image with cropping and mask
  ctx.save();
  
  // Apply mask clipping (if no mask is applied, the image will be drawn normally without clipping)
  if (window.mask && window.mask.type !== 'none') {
    // Apply mask instead of rounded corners
    if (typeof applyMask === 'function') {
      applyMask(ctx, offsetX, offsetY, image.width, image.height);
    }
  }
  
  // Draw the image
  ctx.drawImage(
    image,
    cropWidth, // source X
    cropHeight, // source Y
    sourceWidth, // source width
    sourceHeight, // source height
    offsetX, // destination X
    offsetY, // destination Y
    image.width, // destination width
    image.height // destination height
  );
  
  ctx.restore();

  // NEW: Draw mask border (if enabled) - Add this right after ctx.restore() for the image drawing
  if (typeof drawMaskBorder === 'function') {
    drawMaskBorder(ctx, offsetX, offsetY, image.width, image.height);
  }

  // IMPORTANT: Draw text AFTER all image transformations are complete
  // and imageTransformData has been properly updated
  if (typeof drawAllTexts === 'function') {
    drawAllTexts();
  }

  if (blurObjects && blurObjects.length > 0) {
    window.applyBlurEffects();
  }

  if (isBlurMode) {
    setTimeout(drawAllBlurs, 0);
  }
  
  // Ensure shapes are drawn after image, text, and blur effects
  if (typeof drawAllShapes === 'function') {
    drawAllShapes();
  }
}

// Event listeners for core controls
backgroundSizeInput.addEventListener('input', drawImageWithEffects);
bgCornerRadius.addEventListener('input', drawImageWithEffects);
aspectRatio.addEventListener('change', drawImageWithEffects);
shadowIntensity.addEventListener('input', drawImageWithEffects);
cropIntensity.addEventListener('input', drawImageWithEffects);

// Make sure image input change is handled
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

// Copy image to clipboard function
async function copyImageToClipboard() {
  try {
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png', 1.0);
    });
    
    // Create clipboard item
    const clipboardItem = new ClipboardItem({
      'image/png': blob
    });
    
    // Write to clipboard
    await navigator.clipboard.write([clipboardItem]);
    
    // Visual feedback - temporarily change the copy button
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
    
    // Fallback: show error feedback
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

// Add event listener for the copy button
document.addEventListener('DOMContentLoaded', function() {
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyImageToClipboard);
  }
});