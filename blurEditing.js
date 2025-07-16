const blurTabBtn = document.getElementById('blurTabBtn');
const blurIntensityInput = document.getElementById('blurIntensity');
const blurIntensityDiv = document.getElementById('blurIntensityDiv');

let isDrawing = false;
let startX, startY;
let dragStartX, dragStartY;
let resizing = false;
let resizeHandle = null;

let imageTransformData = {
  sourceX: 0,
  sourceY: 0,
  sourceWidth: 0,
  sourceHeight: 0,
  destX: 0,
  destY: 0,
  destWidth: 0,
  destHeight: 0,
  rotation: 0
};

function toggleBlurMode(activate) {
  isBlurMode = activate;
  
  if (isBlurMode) {
    blurTabBtn.classList.add('active-tab');
  } else {
    blurTabBtn.classList.remove('active-tab');
  }
  
  canvas.style.cursor = isBlurMode ? 'crosshair' : 'default';
  
  if (isBlurMode) {
    saveState();
    updateImageTransformData();
    drawAllBlurs();
  } else {
    selectedBlur = null;
    drawImageWithEffects();
  }
}

function updateImageTransformData() {
  if (!image.src) return;
  
  const backgroundSize = parseInt(backgroundSizeInput.value);
  const selectedAspectRatio = aspectRatio.value;
  const cropPercent = parseInt(cropIntensity.value);
  
  const cropWidth = (cropPercent / 100) * image.width;
  const cropHeight = (cropPercent / 100) * image.height;
  const sourceWidth = image.width - 2 * cropWidth;
  const sourceHeight = image.height - 2 * cropHeight;
  
  let offsetX, offsetY;
  let destWidth = image.width;
  let destHeight = image.height;
  
  if (selectedAspectRatio === 'auto') {
    const frameSize = (backgroundSize / 100) * Math.min(destWidth, destHeight);
    offsetX = frameSize;
    offsetY = frameSize;
  } else {
    offsetX = (canvas.width - destWidth) / 2;
    offsetY = (canvas.height - destHeight) / 2;
  }
  
  imageTransformData = {
    sourceX: cropWidth,
    sourceY: cropHeight,
    sourceWidth: sourceWidth,
    sourceHeight: sourceHeight,
    destX: offsetX,
    destY: offsetY,
    destWidth: destWidth,
    destHeight: destHeight,
    rotation: 0
  };
}

function getPaddingAdjustment() {
  if (typeof isNormalizeMode !== 'undefined' && 
      typeof trulyOriginalImage !== 'undefined' && 
      typeof detectedPadding !== 'undefined' && 
      typeof paddingAmount !== 'undefined' &&
      trulyOriginalImage && trulyOriginalImage.complete) {
    
    if (isNormalizeMode) {
      const contentWidth = trulyOriginalImage.width - detectedPadding.left - detectedPadding.right;
      const contentHeight = trulyOriginalImage.height - detectedPadding.top - detectedPadding.bottom;
      const normalizedPadding = parseInt(paddingAmount.value);
      
      return {
        originalWidth: trulyOriginalImage.width,
        originalHeight: trulyOriginalImage.height,
        contentWidth: contentWidth,
        contentHeight: contentHeight,
        paddedWidth: contentWidth + (normalizedPadding * 2),
        paddedHeight: contentHeight + (normalizedPadding * 2),
        offsetX: normalizedPadding,
        offsetY: normalizedPadding,
        contentOffsetX: detectedPadding.left,
        contentOffsetY: detectedPadding.top
      };
    } else {
      const paddingValue = parseInt(paddingAmount.value);
      if (paddingValue > 0) {
        return {
          originalWidth: trulyOriginalImage.width,
          originalHeight: trulyOriginalImage.height,
          contentWidth: trulyOriginalImage.width,
          contentHeight: trulyOriginalImage.height,
          paddedWidth: trulyOriginalImage.width + (paddingValue * 2),
          paddedHeight: trulyOriginalImage.height + (paddingValue * 2),
          offsetX: paddingValue,
          offsetY: paddingValue,
          contentOffsetX: 0,
          contentOffsetY: 0
        };
      }
    }
  }
  
  return null;
}

function toRelativeCoords(canvasX, canvasY) {
  const relativeToDestX = canvasX - imageTransformData.destX;
  const relativeToDestY = canvasY - imageTransformData.destY;
  
  const sourceRatioX = imageTransformData.sourceWidth / imageTransformData.destWidth;
  const sourceRatioY = imageTransformData.sourceHeight / imageTransformData.destHeight;
  
  const paddingInfo = getPaddingAdjustment();
  
  if (paddingInfo) {
    const contentX = (relativeToDestX * sourceRatioX + imageTransformData.sourceX - paddingInfo.offsetX);
    const contentY = (relativeToDestY * sourceRatioY + imageTransformData.sourceY - paddingInfo.offsetY);
    
    return {
      x: (contentX + paddingInfo.contentOffsetX) / paddingInfo.originalWidth,
      y: (contentY + paddingInfo.contentOffsetY) / paddingInfo.originalHeight
    };
  }
  
  return {
    x: (relativeToDestX * sourceRatioX + imageTransformData.sourceX) / image.width,
    y: (relativeToDestY * sourceRatioY + imageTransformData.sourceY) / image.height
  };
}

function toAbsoluteCoords(relX, relY) {
  const paddingInfo = getPaddingAdjustment();
  
  if (paddingInfo) {
    const originalX = relX * paddingInfo.originalWidth;
    const originalY = relY * paddingInfo.originalHeight;
    
    const contentX = originalX - paddingInfo.contentOffsetX;
    const contentY = originalY - paddingInfo.contentOffsetY;
    
    const paddedX = contentX + paddingInfo.offsetX;
    const paddedY = contentY + paddingInfo.offsetY;
    
    const croppedX = paddedX - imageTransformData.sourceX;
    const croppedY = paddedY - imageTransformData.sourceY;
    
    const destRatioX = imageTransformData.destWidth / imageTransformData.sourceWidth;
    const destRatioY = imageTransformData.destHeight / imageTransformData.sourceHeight;
    
    return {
      x: imageTransformData.destX + croppedX * destRatioX,
      y: imageTransformData.destY + croppedY * destRatioY
    };
  }
  
  const sourceX = relX * image.width;
  const sourceY = relY * image.height;
  
  const croppedX = sourceX - imageTransformData.sourceX;
  const croppedY = sourceY - imageTransformData.sourceY;
  
  const destRatioX = imageTransformData.destWidth / imageTransformData.sourceWidth;
  const destRatioY = imageTransformData.destHeight / imageTransformData.sourceHeight;
  
  return {
    x: imageTransformData.destX + croppedX * destRatioX,
    y: imageTransformData.destY + croppedY * destRatioY
  };
}

function toRelativeSize(size) {
  const paddingInfo = getPaddingAdjustment();
  
  if (paddingInfo) {
    const sourceRatioX = imageTransformData.sourceWidth / imageTransformData.destWidth;
    const contentSize = size * sourceRatioX;
    return contentSize / paddingInfo.originalWidth;
  }
  
  const sourceRatioX = imageTransformData.sourceWidth / imageTransformData.destWidth;
  return (size * sourceRatioX) / image.width;
}

function toAbsoluteSize(relSize) {
  const paddingInfo = getPaddingAdjustment();
  
  if (paddingInfo) {
    const originalSize = relSize * paddingInfo.originalWidth;
    const destRatioX = imageTransformData.destWidth / imageTransformData.sourceWidth;
    return originalSize * destRatioX;
  }
  
  const destRatioX = imageTransformData.destWidth / imageTransformData.sourceWidth;
  return relSize * image.width * destRatioX;
}

function isPointInBlur(x, y, blur) {
  const absPos = toAbsoluteCoords(blur.relX, blur.relY);
  
  if (blur.type === 'rectangle') {
    const absWidth = toAbsoluteSize(blur.relWidth);
    const absHeight = toAbsoluteSize(blur.relHeight);
    return isPointInRect(x, y, absPos.x - absWidth/2, absPos.y - absHeight/2, absWidth, absHeight);
  } else {
    const absRadius = toAbsoluteSize(blur.relRadius);
    const distance = Math.sqrt(Math.pow(x - absPos.x, 2) + Math.pow(y - absPos.y, 2));
    return distance <= absRadius;
  }
}

function isPointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
  return x >= rectX && x <= rectX + rectWidth && 
         y >= rectY && y <= rectY + rectHeight;
}

function applyBlurObject(blur) {
  const absPos = toAbsoluteCoords(blur.relX, blur.relY);
  
  ctx.save();
  ctx.beginPath();
  
  if (blur.type === 'rectangle') {
    const absWidth = toAbsoluteSize(blur.relWidth);
    const absHeight = toAbsoluteSize(blur.relHeight);
    ctx.rect(absPos.x - absWidth/2, absPos.y - absHeight/2, absWidth, absHeight);
  } else {
    const absRadius = toAbsoluteSize(blur.relRadius);
    ctx.arc(absPos.x, absPos.y, absRadius, 0, Math.PI * 2);
  }
  
  ctx.clip();
  ctx.filter = `blur(${blur.intensity}px)`;
  
  const { sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight } = imageTransformData;
  
  if (image.src) {
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );
  } else {
    ctx.fillStyle = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  ctx.restore();
}

function drawAllBlurs() {
  if (blurObjects.length === 0) return;
  
  updateImageTransformData();
  
  blurObjects.forEach((blur, index) => {
    applyBlurObject(blur);
    
    if (selectedBlur === blur) {
      const absPos = toAbsoluteCoords(blur.relX, blur.relY);
      const handleRadius = 6;
      const deleteRadius = 8;
      
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (blur.type === 'rectangle') {
        const absWidth = toAbsoluteSize(blur.relWidth);
        const absHeight = toAbsoluteSize(blur.relHeight);
        ctx.strokeRect(absPos.x - absWidth/2, absPos.y - absHeight/2, absWidth, absHeight);
        
        ctx.setLineDash([]);
        
        // Draw round resize handle (bottom-right corner)
        const handleX = absPos.x + absWidth/2;
        const handleY = absPos.y + absHeight/2;
        
        ctx.fillStyle = '#4CA0FF';
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0066CC';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw round delete button (top-right corner)
        const deleteX = absPos.x + absWidth/2;
        const deleteY = absPos.y - absHeight/2;
        
        ctx.fillStyle = '#FF4C4C';
        ctx.beginPath();
        ctx.arc(deleteX, deleteY, deleteRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CC0000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw X symbol in delete button
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(deleteX - 4, deleteY - 4);
        ctx.lineTo(deleteX + 4, deleteY + 4);
        ctx.moveTo(deleteX + 4, deleteY - 4);
        ctx.lineTo(deleteX - 4, deleteY + 4);
        ctx.stroke();
        
      } else {
        const absRadius = toAbsoluteSize(blur.relRadius);
        ctx.beginPath();
        ctx.arc(absPos.x, absPos.y, absRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Draw round resize handle (right edge)
        const handleX = absPos.x + absRadius;
        const handleY = absPos.y;
        
        ctx.fillStyle = '#4CA0FF';
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0066CC';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw round delete button (top edge)
        const deleteX = absPos.x;
        const deleteY = absPos.y - absRadius;
        
        ctx.fillStyle = '#FF4C4C';
        ctx.beginPath();
        ctx.arc(deleteX, deleteY, deleteRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CC0000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw X symbol in delete button
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(deleteX - 4, deleteY - 4);
        ctx.lineTo(deleteX + 4, deleteY + 4);
        ctx.moveTo(deleteX + 4, deleteY - 4);
        ctx.lineTo(deleteX - 4, deleteY + 4);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }
  });
}

function getResizeHandleCursor(mouseX, mouseY, blur) {
  if (!blur) return null;
  
  const handleRadius = 6;
  const deleteRadius = 8;
  const absPos = toAbsoluteCoords(blur.relX, blur.relY);
  
  if (blur.type === 'rectangle') {
    const absWidth = toAbsoluteSize(blur.relWidth);
    const absHeight = toAbsoluteSize(blur.relHeight);
    
    // Check resize handle (bottom-right corner)
    const handleX = absPos.x + absWidth/2;
    const handleY = absPos.y + absHeight/2;
    const handleDistance = Math.sqrt(Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2));
    if (handleDistance <= handleRadius) {
      return 'nwse-resize';
    }
    
    // Check delete button (top-right corner)
    const deleteX = absPos.x + absWidth/2;
    const deleteY = absPos.y - absHeight/2;
    const deleteDistance = Math.sqrt(Math.pow(mouseX - deleteX, 2) + Math.pow(mouseY - deleteY, 2));
    if (deleteDistance <= deleteRadius) {
      return 'pointer';
    }
  } else if (blur.type === 'circle') {
    const absRadius = toAbsoluteSize(blur.relRadius);
    
    // Check resize handle (right edge)
    const handleX = absPos.x + absRadius;
    const handleY = absPos.y;
    const handleDistance = Math.sqrt(Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2));
    if (handleDistance <= handleRadius) {
      return 'ew-resize';
    }
    
    // Check delete button (top edge)
    const deleteX = absPos.x;
    const deleteY = absPos.y - absRadius;
    const deleteDistance = Math.sqrt(Math.pow(mouseX - deleteX, 2) + Math.pow(mouseY - deleteY, 2));
    if (deleteDistance <= deleteRadius) {
      return 'pointer';
    }
  }
  
  return null;
}

function setupBlurCanvasEventListeners() {
  canvas.addEventListener('mousedown', handleBlurMouseDown);
  canvas.addEventListener('mousemove', handleBlurMouseMove);
  canvas.addEventListener('mouseup', handleBlurMouseUp);
  canvas.addEventListener('mouseleave', handleBlurMouseLeave);
}

function removeBlurCanvasEventListeners() {
  canvas.removeEventListener('mousedown', handleBlurMouseDown);
  canvas.removeEventListener('mousemove', handleBlurMouseMove);
  canvas.removeEventListener('mouseup', handleBlurMouseUp);
  canvas.removeEventListener('mouseleave', handleBlurMouseLeave);
}

function handleBlurMouseDown(e) {
  if (!isBlurMode) return;
  
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  let clickedOnBlur = false;
  for (let i = blurObjects.length - 1; i >= 0; i--) {
    const blur = blurObjects[i];
    
    if (selectedBlur === blur) {
      const handleRadius = 6;
      const deleteRadius = 8;
      const absPos = toAbsoluteCoords(blur.relX, blur.relY);
      
      if (blur.type === 'rectangle') {
        const absWidth = toAbsoluteSize(blur.relWidth);
        const absHeight = toAbsoluteSize(blur.relHeight);
        
        // Check delete button click
        const deleteX = absPos.x + absWidth/2;
        const deleteY = absPos.y - absHeight/2;
        const deleteDistance = Math.sqrt(Math.pow(mouseX - deleteX, 2) + Math.pow(mouseY - deleteY, 2));
        if (deleteDistance <= deleteRadius) {
          const index = blurObjects.indexOf(selectedBlur);
          if (index > -1) {
            blurObjects.splice(index, 1);
            selectedBlur = null;
            drawImageWithEffects();
            drawAllBlurs();
            saveState();
            return;
          }
        }
        
        // Check resize handle click
        const handleX = absPos.x + absWidth/2;
        const handleY = absPos.y + absHeight/2;
        const handleDistance = Math.sqrt(Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2));
        if (handleDistance <= handleRadius) {
          resizing = true;
          resizeHandle = 'bottomRight';
          clickedOnBlur = true;
          break;
        }
      } else if (blur.type === 'circle') {
        const absRadius = toAbsoluteSize(blur.relRadius);
        
        // Check delete button click
        const deleteX = absPos.x;
        const deleteY = absPos.y - absRadius;
        const deleteDistance = Math.sqrt(Math.pow(mouseX - deleteX, 2) + Math.pow(mouseY - deleteY, 2));
        if (deleteDistance <= deleteRadius) {
          const index = blurObjects.indexOf(selectedBlur);
          if (index > -1) {
            blurObjects.splice(index, 1);
            selectedBlur = null;
            drawImageWithEffects();
            drawAllBlurs();
            saveState();
            return;
          }
        }
        
        // Check resize handle click
        const handleX = absPos.x + absRadius;
        const handleY = absPos.y;
        const handleDistance = Math.sqrt(Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2));
        if (handleDistance <= handleRadius) {
          resizing = true;
          resizeHandle = 'circleEdge';
          clickedOnBlur = true;
          break;
        }
      }
    }
    
    if (isPointInBlur(mouseX, mouseY, blur)) {
      selectedBlur = blur;
      dragStartX = mouseX;
      dragStartY = mouseY;
      clickedOnBlur = true;
      drawImageWithEffects();
      drawAllBlurs();
      break;
    }
  }
  
  if (!clickedOnBlur) {
    isDrawing = true;
    startX = mouseX;
    startY = mouseY;
    selectedBlur = null;
    drawImageWithEffects();
    drawAllBlurs();
  }
}

function handleBlurMouseMove(e) {
  if (!isBlurMode) return;
  
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  let cursorChanged = false;
  
  if (selectedBlur) {
    const handleCursor = getResizeHandleCursor(mouseX, mouseY, selectedBlur);
    if (handleCursor) {
      canvas.style.cursor = handleCursor;
      cursorChanged = true;
    }
  }
  
  if (!cursorChanged) {
    for (let i = blurObjects.length - 1; i >= 0; i--) {
      const blur = blurObjects[i];
      if (isPointInBlur(mouseX, mouseY, blur)) {
        canvas.style.cursor = 'move';
        cursorChanged = true;
        break;
      }
    }
  }
  
  if (!cursorChanged && isBlurMode) {
    canvas.style.cursor = 'crosshair';
  }
  
  if (isDrawing) {
    drawImageWithEffects();
    drawAllBlurs();
    
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Use the getSelectedBlurShape function from blurbuttons.js
    const currentShape = window.getSelectedBlurShape ? window.getSelectedBlurShape() : 'rectangle';
    
    if (currentShape === 'rectangle') {
      ctx.strokeRect(startX, startY, mouseX - startX, mouseY - startY);
    } else {
      const radius = Math.sqrt(Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2));
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  } else if (selectedBlur && resizing) {
    const absPos = toAbsoluteCoords(selectedBlur.relX, selectedBlur.relY);
    
    if (resizeHandle === 'bottomRight' && selectedBlur.type === 'rectangle') {
      const absWidth = toAbsoluteSize(selectedBlur.relWidth);
      const absHeight = toAbsoluteSize(selectedBlur.relHeight);
      
      const newWidth = (mouseX - (absPos.x - absWidth/2)) * 2;
      const newHeight = (mouseY - (absPos.y - absHeight/2)) * 2;
      
      if (newWidth > 10 && newHeight > 10) {
        selectedBlur.relWidth = toRelativeSize(newWidth / 2);
        selectedBlur.relHeight = toRelativeSize(newHeight / 2);
      }
    } else if (resizeHandle === 'circleEdge' && selectedBlur.type === 'circle') {
      const deltaX = mouseX - absPos.x;
      const deltaY = mouseY - absPos.y;
      const newRadius = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      
      if (newRadius > 5) {
        selectedBlur.relRadius = toRelativeSize(newRadius);
      }
    }
    
    drawImageWithEffects();
    drawAllBlurs();
  } else if (selectedBlur && !resizing && dragStartX !== undefined) {
    const deltaX = mouseX - dragStartX;
    const deltaY = mouseY - dragStartY;
    
    const absPos = toAbsoluteCoords(selectedBlur.relX, selectedBlur.relY);
    const newAbsX = absPos.x + deltaX;
    const newAbsY = absPos.y + deltaY;
    
    const relPos = toRelativeCoords(newAbsX, newAbsY);
    selectedBlur.relX = relPos.x;
    selectedBlur.relY = relPos.y;
    
    dragStartX = mouseX;
    dragStartY = mouseY;
    
    drawImageWithEffects();
    drawAllBlurs();
  }
}

function handleBlurMouseUp(e) {
  if (!isBlurMode) return;
  
  if (isDrawing) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    let newBlur;
    // Use the getSelectedBlurShape function from blurbuttons.js
    const currentShape = window.getSelectedBlurShape ? window.getSelectedBlurShape() : 'rectangle';
    
    if (currentShape === 'rectangle') {
      const width = Math.abs(mouseX - startX);
      const height = Math.abs(mouseY - startY);
      
      if (width > 5 && height > 5) {
        const centerX = startX + (mouseX - startX) / 2;
        const centerY = startY + (mouseY - startY) / 2;
        
        const relPos = toRelativeCoords(centerX, centerY);
        
        newBlur = {
          type: 'rectangle',
          relX: relPos.x,
          relY: relPos.y,
          relWidth: toRelativeSize(width),
          relHeight: toRelativeSize(height),
          intensity: parseInt(blurIntensityInput.value)
        };
        blurObjects.push(newBlur);
        selectedBlur = newBlur;
      }
    } else {
      const radius = Math.sqrt(Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2));
      
      if (radius > 5) {
        const relPos = toRelativeCoords(startX, startY);
        
        newBlur = {
          type: 'circle',
          relX: relPos.x,
          relY: relPos.y,
          relRadius: toRelativeSize(radius),
          intensity: parseInt(blurIntensityInput.value)
        };
        blurObjects.push(newBlur);
        selectedBlur = newBlur;
      }
    }
    
    drawImageWithEffects();
    drawAllBlurs();
    saveState();
  }
  
  isDrawing = false;
  resizing = false;
  dragStartX = undefined;
  dragStartY = undefined;
}

function handleBlurMouseLeave() {
  if (isBlurMode) {
    isDrawing = false;
    resizing = false;
  }
}

blurIntensityInput.addEventListener('input', () => {
  if (selectedBlur) {
    selectedBlur.intensity = parseInt(blurIntensityInput.value);
    drawImageWithEffects();
    drawAllBlurs();
  }
});

document.addEventListener('keydown', (e) => {
  if (isBlurMode && selectedBlur && e.key === 'Delete') {
    const index = blurObjects.indexOf(selectedBlur);
    if (index > -1) {
      blurObjects.splice(index, 1);
      selectedBlur = null;
      drawImageWithEffects();
      drawAllBlurs();
      saveState();
    }
  }
});

function applyBlurEffects() {
  if (blurObjects.length > 0) {
    updateImageTransformData();
    blurObjects.forEach(blur => {
      applyBlurObject(blur);
    });
  }
}

window.applyBlurEffects = applyBlurEffects;

window.blurToolFunctions = {
  activate: function() {
    toggleBlurMode(true);
    setupBlurCanvasEventListeners();
  },
  deactivate: function() {
    toggleBlurMode(false);
    removeBlurCanvasEventListeners();
  }
};