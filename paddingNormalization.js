const normalizeToggle = document.getElementById('normalizeToggle');
const normalizationControls = document.getElementById('normalizationControls');
const paddingAmount = document.getElementById('paddingAmount');
const paddingTopElement = document.getElementById('paddingTop');
const paddingRightElement = document.getElementById('paddingRight');
const paddingBottomElement = document.getElementById('paddingBottom');
const paddingLeftElement = document.getElementById('paddingLeft');
const paddingColorPicker = document.getElementById('paddingColor');

let isNormalizeMode = normalizeToggle.checked;
let trulyOriginalImage = null;
let originalImage = null;
let detectedPadding = { top: 0, right: 0, bottom: 0, left: 0 };
let paddingColor = { r: 255, g: 255, b: 255 };
let isPaddingDetected = false; // Track if padding has been detected

paddingAmount.value = isNormalizeMode ? 50 : 0;

function initPaddingColor() {
  const hex = paddingColorPicker.value;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  paddingColor = { r, g, b };
}
initPaddingColor();

normalizeToggle.addEventListener('change', toggleNormalizeMode);
paddingAmount.addEventListener('input', updatePadding);
paddingColorPicker.addEventListener('input', updatePaddingColor);

document.addEventListener('DOMContentLoaded', function() {
  if (!normalizeToggle.checked) {
    paddingAmount.value = 0;
  }
});

function storeOriginalImage() {
  if (image && image.src && image.complete) {
    console.log("Storing original image");
    trulyOriginalImage = new Image();
    trulyOriginalImage.crossOrigin = "Anonymous";
    trulyOriginalImage.src = image.src;
    
    originalImage = new Image();
    originalImage.crossOrigin = "Anonymous";
    originalImage.onload = function() {
      // Always detect padding when image loads, regardless of current mode
      detectImagePadding();
    };
    originalImage.src = image.src;
    
    // Reset padding detection flag when storing new image
    isPaddingDetected = false;
    
    return true;
  }
  return false;
}

function toggleNormalizeMode() {
  isNormalizeMode = normalizeToggle.checked;
  console.log("Normalize mode toggled:", isNormalizeMode);
  
  if (!isNormalizeMode) {
    paddingAmount.value = 0;
  } else {
    paddingAmount.value = 50;
  }
  
  if (!trulyOriginalImage || !trulyOriginalImage.complete) {
    if (!storeOriginalImage()) {
      console.log("No image available to normalize");
      return;
    }
  }
  
  if (trulyOriginalImage && trulyOriginalImage.complete) {
    originalImage = new Image();
    originalImage.crossOrigin = "Anonymous";
    originalImage.src = trulyOriginalImage.src;
    
    originalImage.onload = function() {
      if (isNormalizeMode) {
        // Use already detected padding if available, otherwise detect
        if (isPaddingDetected) {
          updateNormalizedImage();
        } else {
          detectImagePadding();
        }
      } else {
        applyDirectPadding();
      }
    };
  } else {
    console.log("No original image available");
  }
}

function updatePaddingColor() {
  const hex = paddingColorPicker.value;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  paddingColor = { r, g, b };
  console.log("Padding color updated:", paddingColor);
  
  if (isNormalizeMode) {
    updateNormalizedImage();
  } else {
    applyDirectPadding();
  }
}

function updatePadding() {
  console.log("Updating padding, normalize mode:", isNormalizeMode);
  
  if (!trulyOriginalImage || !trulyOriginalImage.complete) {
    if (!storeOriginalImage()) {
      console.log("Cannot update padding: No original image");
      return;
    }
  }
  
  if (isNormalizeMode) {
    // If padding already detected, just update the normalized image
    if (isPaddingDetected) {
      console.log("Using already detected padding values");
      updateNormalizedImage();
    } else {
      // Only detect padding if not already detected
      console.log("Detecting padding for the first time");
      originalImage = new Image();
      originalImage.crossOrigin = "Anonymous";
      originalImage.src = trulyOriginalImage.src;
      originalImage.onload = function() {
        detectImagePadding();
      };
    }
  } else {
    originalImage = new Image();
    originalImage.crossOrigin = "Anonymous";
    originalImage.src = trulyOriginalImage.src;
    originalImage.onload = function() {
      applyDirectPadding();
    };
  }
}

function detectImagePadding() {
  if (!originalImage || !originalImage.complete) {
    console.log("Original image not loaded yet for padding detection");
    setTimeout(detectImagePadding, 100);
    return;
  }
  
  console.log("Detecting image padding");
  
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  tempCanvas.width = originalImage.width;
  tempCanvas.height = originalImage.height;
  tempCtx.drawImage(originalImage, 0, 0);
  
  try {
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    // Step 1: Detect dominant edge colors
    const edgeColors = detectDominantEdgeColors(data, tempCanvas.width, tempCanvas.height);
    console.log("Detected edge colors:", edgeColors);
    
    // Step 2: Find content boundaries using detected edge colors
    let top = tempCanvas.height;
    let right = 0;
    let bottom = 0;
    let left = tempCanvas.width;
    
    for (let y = 0; y < tempCanvas.height; y++) {
      for (let x = 0; x < tempCanvas.width; x++) {
        const index = (y * tempCanvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        if (a < 250) continue;
        
        // Check if this pixel is NOT similar to any detected edge color
        const isContent = !isPixelSimilarToEdgeColors(r, g, b, edgeColors);
        
        if (isContent) {
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
          left = Math.min(left, x);
        }
      }
    }
    
    detectedPadding = {
      top: top,
      right: tempCanvas.width - right - 1,
      bottom: tempCanvas.height - bottom - 1,
      left: left
    };
    
    console.log("Detected padding:", detectedPadding);
    
    // Use the most dominant edge color as padding color
    paddingColor = edgeColors.length > 0 ? edgeColors[0].color : { r: 255, g: 255, b: 255 };
    
    const hexColor = rgbToHex(paddingColor.r, paddingColor.g, paddingColor.b);
    paddingColorPicker.value = hexColor;
    
    paddingTopElement.textContent = detectedPadding.top;
    paddingRightElement.textContent = detectedPadding.right;
    paddingBottomElement.textContent = detectedPadding.bottom;
    paddingLeftElement.textContent = detectedPadding.left;
    
    // Mark padding as detected
    isPaddingDetected = true;
    
    updateNormalizedImage();
  } catch (error) {
    console.error("Error detecting padding:", error);
  }
}

function detectDominantEdgeColors(data, width, height) {
  const colorCounts = new Map();
  const edgeThickness = Math.min(3, Math.floor(Math.min(width, height) / 20)); // Max 3px, or 5% of smallest dimension
  
  // Sample colors from all four edges
  const samplePixel = (x, y) => {
    const index = (y * width + x) * 4;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];
    
    if (a < 250) return; // Skip transparent pixels
    
    // Create color key (rounded to reduce noise)
    const colorKey = `${Math.round(r/5)*5},${Math.round(g/5)*5},${Math.round(b/5)*5}`;
    
    if (!colorCounts.has(colorKey)) {
      colorCounts.set(colorKey, { count: 0, r, g, b });
    }
    colorCounts.get(colorKey).count++;
  };
  
  // Sample top edge
  for (let y = 0; y < Math.min(edgeThickness, height); y++) {
    for (let x = 0; x < width; x += 2) { // Sample every 2nd pixel for performance
      samplePixel(x, y);
    }
  }
  
  // Sample bottom edge
  for (let y = Math.max(0, height - edgeThickness); y < height; y++) {
    for (let x = 0; x < width; x += 2) {
      samplePixel(x, y);
    }
  }
  
  // Sample left edge
  for (let x = 0; x < Math.min(edgeThickness, width); x++) {
    for (let y = 0; y < height; y += 2) {
      samplePixel(x, y);
    }
  }
  
  // Sample right edge
  for (let x = Math.max(0, width - edgeThickness); x < width; x++) {
    for (let y = 0; y < height; y += 2) {
      samplePixel(x, y);
    }
  }
  
  // Convert to array and sort by count
  const sortedColors = Array.from(colorCounts.entries())
    .map(([key, data]) => ({
      color: { r: data.r, g: data.g, b: data.b },
      count: data.count
    }))
    .sort((a, b) => b.count - a.count);
  
  // Return top 3 most common edge colors
  return sortedColors.slice(0, 3);
}

function isPixelSimilarToEdgeColors(r, g, b, edgeColors) {
  const colorTolerance = 25; // Tolerance for color similarity
  
  for (const edgeColor of edgeColors) {
    const { r: er, g: eg, b: eb } = edgeColor.color;
    
    // Calculate color distance
    const distance = Math.sqrt(
      (r - er) * (r - er) +
      (g - eg) * (g - eg) +
      (b - eb) * (b - eb)
    );
    
    if (distance <= colorTolerance) {
      return true;
    }
  }
  
  return false;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function detectPaddingColor(ctx, width, height, padding) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const hasPadding = 
    padding.top > 5 || 
    padding.right > 5 || 
    padding.bottom > 5 || 
    padding.left > 5;
  
  if (!hasPadding) {
    return { r: 255, g: 255, b: 255 };
  }
  
  const paddingSamples = [];
  
  if (padding.top > 5) {
    const y = Math.floor(padding.top / 2);
    for (let x = 0; x < width; x += 5) {
      const index = (y * width + x) * 4;
      if (data[index + 3] > 250) {
        paddingSamples.push({
          r: data[index],
          g: data[index + 1],
          b: data[index + 2]
        });
      }
    }
  }
  
  if (padding.bottom > 5) {
    const y = height - Math.floor(padding.bottom / 2) - 1;
    for (let x = 0; x < width; x += 5) {
      const index = (y * width + x) * 4;
      if (data[index + 3] > 250) {
        paddingSamples.push({
          r: data[index],
          g: data[index + 1],
          b: data[index + 2]
        });
      }
    }
  }
  
  if (padding.left > 5) {
    const x = Math.floor(padding.left / 2);
    for (let y = 0; y < height; y += 5) {
      const index = (y * width + x) * 4;
      if (data[index + 3] > 250) {
        paddingSamples.push({
          r: data[index],
          g: data[index + 1],
          b: data[index + 2]
        });
      }
    }
  }
  
  if (padding.right > 5) {
    const x = width - Math.floor(padding.right / 2) - 1;
    for (let y = 0; y < height; y += 5) {
      const index = (y * width + x) * 4;
      if (data[index + 3] > 250) {
        paddingSamples.push({
          r: data[index],
          g: data[index + 1],
          b: data[index + 2]
        });
      }
    }
  }
  
  if (paddingSamples.length > 0) {
    let totalR = 0, totalG = 0, totalB = 0;
    for (const sample of paddingSamples) {
      totalR += sample.r;
      totalG += sample.g;
      totalB += sample.b;
    }
    
    return {
      r: Math.round(totalR / paddingSamples.length),
      g: Math.round(totalG / paddingSamples.length),
      b: Math.round(totalB / paddingSamples.length)
    };
  }
  
  return { r: 255, g: 255, b: 255 };
}

function applyDirectPadding() {
  if (!originalImage || !originalImage.complete) {
    console.log("Original image not loaded yet for direct padding");
    setTimeout(applyDirectPadding, 100);
    return;
  }
  
  console.log("Applying direct padding");
  
  try {
    const paddingValue = parseInt(paddingAmount.value);
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    tempCanvas.width = originalImage.width + (paddingValue * 2);
    tempCanvas.height = originalImage.height + (paddingValue * 2);
    
    tempCtx.fillStyle = `rgb(${paddingColor.r}, ${paddingColor.g}, ${paddingColor.b})`;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    tempCtx.drawImage(
      originalImage,
      paddingValue, paddingValue, originalImage.width, originalImage.height
    );
    
    const newImage = new Image();
    newImage.crossOrigin = "Anonymous";
    
    newImage.onload = function() {
      image.src = newImage.src;
      image.onload = function() {
        drawImageWithEffects();
      };
    };
    
    newImage.src = tempCanvas.toDataURL('image/png');
  } catch (error) {
    console.error("Error applying direct padding:", error);
  }
}

function updateNormalizedImage() {
  if (!isNormalizeMode || !originalImage || !originalImage.complete) {
    console.log("Cannot update normalized image - prerequisites not met");
    return;
  }
  
  console.log("Updating normalized image");
  
  try {
    paddingTopElement.textContent = detectedPadding.top;
    paddingRightElement.textContent = detectedPadding.right;
    paddingBottomElement.textContent = detectedPadding.bottom;
    paddingLeftElement.textContent = detectedPadding.left;
    
    const contentWidth = originalImage.width - detectedPadding.left - detectedPadding.right;
    const contentHeight = originalImage.height - detectedPadding.top - detectedPadding.bottom;
    
    const normalizedPadding = parseInt(paddingAmount.value);
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    tempCanvas.width = contentWidth + (normalizedPadding * 2);
    tempCanvas.height = contentHeight + (normalizedPadding * 2);
    
    tempCtx.fillStyle = `rgb(${paddingColor.r}, ${paddingColor.g}, ${paddingColor.b})`;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    tempCtx.drawImage(
      originalImage,
      detectedPadding.left, detectedPadding.top, contentWidth, contentHeight,
      normalizedPadding, normalizedPadding, contentWidth, contentHeight
    );
    
    const newImage = new Image();
    newImage.crossOrigin = "Anonymous";
    newImage.onload = function() {
      image.src = newImage.src;
      image.onload = function() {
        drawImageWithEffects();
      };
    };
    
    newImage.src = tempCanvas.toDataURL('image/png');
  } catch (error) {
    console.error("Error normalizing image:", error);
  }
}

const originalImageOnloadHandler = image.onload;
image.onload = function() {
  storeOriginalImage();
  
  if (typeof originalImageOnloadHandler === 'function') {
    originalImageOnloadHandler.call(image);
  }
};

imageInput.addEventListener('change', function(e) {
  console.log("Image input changed, original will be stored when loaded");
});

canvasWrapper.addEventListener('drop', function(e) {
  console.log("Drop event detected, original will be stored when loaded");
});

const originalDrawImageWithEffects = window.drawImageWithEffects;
window.drawImageWithEffects = function() {
  originalDrawImageWithEffects.call(window);
  
  if ((!trulyOriginalImage || !trulyOriginalImage.complete) && image && image.complete) {
    storeOriginalImage();
  }
};