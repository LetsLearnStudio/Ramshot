// Text objects management
// Note: textObjects, selectedText, and isTextMode are defined in script.js
let isDraggingText = false;
let textDragStartX = 0; // Stores absolute X offset from mouse to text center
let textDragStartY = 0; // Stores absolute Y offset from mouse to text center
let isResizingText = false; // Added for text resizing

// Font options
const fontOptions = [
  'Arial',
  'Verdana',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Inter'
];

// Font size min/max values
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 120;
const DEFAULT_FONT_SIZE = 24;

// Helper function to check if text mode is active
function isTextModeActive() {
  // First, ensure blur mode is not active, as it should take precedence.
  const blurIsOn = (typeof window.toolsState !== 'undefined' && window.toolsState.isBlurMode) ||
                   (typeof window.isBlurMode !== 'undefined' && window.isBlurMode) ||
                   (typeof isBlurMode !== 'undefined' && isBlurMode);

  if (blurIsOn) {
    return false;
  }

  // If blur is not on, then check if text mode is on.
  const textIsOn = (typeof window.toolsState !== 'undefined' && window.toolsState.isTextMode) ||
                   (typeof window.isTextMode !== 'undefined' && window.isTextMode) ||
                   (typeof isTextMode !== 'undefined' && isTextMode);

  return textIsOn;
}


// Helper functions for converting font sizes to/from relative values
// Assuming image, imageTransformData, getPaddingAdjustment are globally accessible from script.js and blurEditing.js
function toRelativeFontSize(pixelFontSize) {
  const paddingInfo = getPaddingAdjustment();
  if (paddingInfo) {
    // Scale font size relative to the content height after padding/cropping is considered
    // This scales it to a proportion of the original image's height
    const sourceRatioY = imageTransformData.sourceHeight / imageTransformData.destHeight;
    const contentFontSize = pixelFontSize * sourceRatioY;
    return contentFontSize / paddingInfo.originalHeight;
  }
  // If no padding, scale relative to the image's natural height
  const sourceRatioY = imageTransformData.sourceHeight / imageTransformData.destHeight;
  return (pixelFontSize * sourceRatioY) / image.height;
}

function toAbsoluteFontSize(relativeFontSize) {
  const paddingInfo = getPaddingAdjustment();
  let absoluteFontSize;

  if (paddingInfo) {
    // Scale from relative to content height, then to destination height
    const contentFontSize = relativeFontSize * paddingInfo.originalHeight;
    const destRatioY = imageTransformData.destHeight / imageTransformData.sourceHeight;
    absoluteFontSize = contentFontSize * destRatioY;
  } else {
    // Scale relative to image's natural height, then to destination height
    const sourceFontSize = relativeFontSize * image.height;
    const destRatioY = imageTransformData.destHeight / imageTransformData.sourceHeight;
    absoluteFontSize = sourceFontSize * destRatioY;
  }
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, absoluteFontSize)); // Clamp to min/max
}


// Initialize the text editing UI elements
function initTextEditing() {
  const textControlsDiv = document.getElementById('textControlsDiv');
  const textTabBtn = document.getElementById('textTabBtn');

  if (!textTabBtn || !textControlsDiv) {
    console.error('Text editing UI elements not found in the DOM');
    return;
  }

  textTabBtn.addEventListener('click', function() {
    isTextMode = !isTextMode;
    textTabBtn.classList.toggle('active', isTextMode);
    textControlsDiv.style.display = isTextMode ? 'block' : 'none';

    if (!isTextMode) {
      selectedText = null;
      updateTextButtonState();
      isDraggingText = false;
      isResizingText = false; // Reset resizing state
      drawImageWithEffects();
    }

    if (isTextMode) {
      const shapeTabBtn = document.getElementById('shapeTabBtn');
      if (shapeTabBtn && shapeTabBtn.classList.contains('active')) {
        shapeTabBtn.click();
      }
      const blurToggle = document.getElementById('blurToggle');
      if (blurToggle && blurToggle.checked) {
        blurToggle.checked = false;
        const event = new Event('change');
        blurToggle.dispatchEvent(event);
      }
      document.getElementById('canvas').style.cursor = 'auto';
    } else {
      document.getElementById('canvas').style.cursor = 'default';
    }

    if (isTextMode && selectedText) {
      if (!textAnimationFrameId) {
        animateTextSelections();
      }
    } else {
      if (textAnimationFrameId) {
        cancelAnimationFrame(textAnimationFrameId);
        textAnimationFrameId = null;
      }
    }
  });

  document.getElementById('textInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      handleTextButtonClick();
    }
  });

  const fontSizeSlider = document.getElementById('fontSize');
  fontSizeSlider.addEventListener('input', function() {
    const value = this.value;
    document.getElementById('fontSizeValue').textContent = `${value}px`;
    updateSelectedTextSize();
  });

  const fontTypeSelect = document.getElementById('fontType');
  fontTypeSelect.addEventListener('change', updateSelectedTextFont);

  const textColorPicker = document.getElementById('textColor');
  textColorPicker.addEventListener('input', updateSelectedTextColor);

  canvas.addEventListener('mousedown', handleTextMouseDown);
  canvas.addEventListener('mousemove', handleTextMouseMove);
  canvas.addEventListener('mouseup', handleTextMouseUp);
  canvas.addEventListener('dblclick', handleTextDoubleClick);

  document.addEventListener('keydown', handleTextKeyDown);

  // Corrected: Changed 'addUpdateTextBtn' to 'addTextBtn' to match editor.html
  const addUpdateTextBtn = document.getElementById('addTextBtn');
  if (addUpdateTextBtn) {
    addUpdateTextBtn.addEventListener('click', handleTextButtonClick);
  }

  updateFontTypeOptions();
  updateTextButtonState();
}

function updateFontTypeOptions() {
  const fontTypeSelect = document.getElementById('fontType');
  // Clear existing options to prevent duplicates
  fontTypeSelect.innerHTML = '';
  fontOptions.forEach(font => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    fontTypeSelect.appendChild(option);
  });
}

function addTextFromInput() {
  const textInput = document.getElementById('textInput');
  const fontType = document.getElementById('fontType').value;
  const textColor = document.getElementById('textColor').value;
  const text = textInput.value.trim();

  if (!text) {
    alert('Please enter some text!');
    return;
  }

  // Convert canvas center to relative coordinates
  const relCoords = toRelativeCoords(canvas.width / 2, canvas.height / 2);
  // Convert default pixel font size to relative font size
  const relFontSize = toRelativeFontSize(DEFAULT_FONT_SIZE);

  const textObj = {
    text: text,
    relX: relCoords.x, // Store relative X
    relY: relCoords.y, // Store relative Y
    relFontSize: relFontSize, // Store relative font size
    fontFamily: fontType, // Store font family separately
    color: textColor,
    isDragging: false,
    currentWidth: 0, // Temporary for drawing/interaction
    currentHeight: 0 // Temporary for drawing/interaction
  };

  textObjects.push(textObj);
  selectedText = textObj;
  updateTextButtonState();

  textInput.value = '';
  textInput.focus();
  drawImageWithEffects();
  addToHistory();
}

function handleTextButtonClick() {
  if (selectedText) {
    updateSelectedTextContent();
  } else {
    addTextFromInput();
  }
}

function updateTextButtonState() {
  const textBtnLabel = document.getElementById('textBtnLabel');
  if (textBtnLabel) {
    if (selectedText) {
      textBtnLabel.textContent = 'Update Text';
      // Set the input fields to the selected text's properties
      document.getElementById('textInput').value = selectedText.text;
      document.getElementById('fontType').value = selectedText.fontFamily;
      document.getElementById('textColor').value = selectedText.color;
      const absoluteFontSize = toAbsoluteFontSize(selectedText.relFontSize);
      document.getElementById('fontSize').value = absoluteFontSize;
      document.getElementById('fontSizeValue').textContent = `${Math.round(absoluteFontSize)}px`;
    } else {
      textBtnLabel.textContent = 'Add Text';
      // Clear input fields when no text is selected
      document.getElementById('textInput').value = '';
      document.getElementById('fontType').value = fontOptions[0]; // Set to default or first font
      document.getElementById('textColor').value = '#000000'; // Default color
      document.getElementById('fontSize').value = DEFAULT_FONT_SIZE;
      document.getElementById('fontSizeValue').textContent = `${DEFAULT_FONT_SIZE}px`;
    }
  }
}

function updateSelectedTextContent() {
  if (selectedText) {
    const textInput = document.getElementById('textInput');
    const fontTypeSelect = document.getElementById('fontType');
    const textColorPicker = document.getElementById('textColor');
    const fontSizeSlider = document.getElementById('fontSize');

    selectedText.text = textInput.value.trim();
    selectedText.fontFamily = fontTypeSelect.value; // Update font family
    selectedText.color = textColorPicker.value;
    selectedText.relFontSize = toRelativeFontSize(parseInt(fontSizeSlider.value)); // Update relative font size

    drawImageWithEffects();
    addToHistory();
  }
}

function updateSelectedTextSize() {
  if (selectedText) {
    const fontSize = parseInt(document.getElementById('fontSize').value);
    selectedText.relFontSize = toRelativeFontSize(fontSize); // Convert pixel to relative
    drawImageWithEffects();
  }
}

function updateSelectedTextFont() {
  if (selectedText) {
    selectedText.fontFamily = document.getElementById('fontType').value; // Update font family
    drawImageWithEffects();
  }
}

function updateSelectedTextColor() {
  if (selectedText) {
    selectedText.color = document.getElementById('textColor').value;
    drawImageWithEffects();
  }
}


function handleTextMouseDown(e) {
  if (!isTextModeActive()) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  // Check for delete button first
  for (let i = textObjects.length - 1; i >= 0; i--) {
    const textObj = textObjects[i];
    if (isPointInDeleteButtonText(x, y, textObj)) {
      textObjects.splice(i, 1);
      selectedText = null;
      updateTextButtonState();
      drawImageWithEffects();
      addToHistory();
      e.stopPropagation();
      return;
    }
  }

  // Check for resize handle
  for (let i = textObjects.length - 1; i >= 0; i--) {
    const textObj = textObjects[i];
    if (isPointInResizeHandleText(x, y, textObj)) {
      isResizingText = true;
      selectedText = textObj;
      // Store initial mouse position for resizing relative to the handle
      textDragStartX = x - (toAbsoluteCoords(textObj.relX, textObj.relY).x + textObj.currentWidth / 2 + 10); // Adjust to handle position
      textDragStartY = y - (toAbsoluteCoords(textObj.relX, textObj.relY).y + textObj.currentHeight / 2 + 10); // Adjust to handle position
      e.stopPropagation();
      return;
    }
  }

  // Check for text selection/drag
  const clickedText = findTextAtPosition(x, y);
  if (clickedText) {
    selectedText = clickedText;
    isDraggingText = true;
    const absCoords = toAbsoluteCoords(selectedText.relX, selectedText.relY);
    textDragStartX = x - absCoords.x; // Store offset from text center to mouse click
    textDragStartY = y - absCoords.y; // Store offset from text center to mouse click

    document.getElementById('textInput').value = selectedText.text;
    document.getElementById('fontType').value = selectedText.fontFamily; // Set font family
    document.getElementById('textColor').value = selectedText.color;
    document.getElementById('fontSize').value = toAbsoluteFontSize(selectedText.relFontSize); // Set slider value
    document.getElementById('fontSizeValue').textContent = `${toAbsoluteFontSize(selectedText.relFontSize)}px`;

    updateTextButtonState();
    drawImageWithEffects(); // Redraw to show selection
    e.stopPropagation();
  } else {
    selectedText = null;
    updateTextButtonState();
    drawImageWithEffects();
  }
}

function handleTextMouseMove(e) {
  if (!isTextModeActive()) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  if (isDraggingText && selectedText) {
    const newAbsX = x - textDragStartX; // Calculate new absolute center X
    const newAbsY = y - textDragStartY; // Calculate new absolute center Y
    const newRelCoords = toRelativeCoords(newAbsX, newAbsY); // Convert to relative
    selectedText.relX = newRelCoords.x; // Update relative X
    selectedText.relY = newRelCoords.y; // Update relative Y
    drawImageWithEffects();
  } else if (isResizingText && selectedText) {
    const absCoords = toAbsoluteCoords(selectedText.relX, selectedText.relY);
    const centerX = absCoords.x;
    const centerY = absCoords.y;

    // Calculate distance from center to mouse position
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

    // A simple linear scaling based on distance from center for font size
    // You might need a more sophisticated scaling logic depending on desired behavior
    let newFontSize = dist / 2; // This is a rough estimation, adjust as needed

    newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newFontSize));

    selectedText.relFontSize = toRelativeFontSize(newFontSize); // Update relative font size
    document.getElementById('fontSize').value = newFontSize; // Update slider
    document.getElementById('fontSizeValue').textContent = `${newFontSize}px`;
    drawImageWithEffects();
  } else {
    updateTextCursor(x, y);
  }
}

function handleTextMouseUp() {
  if (!isTextModeActive()) {
    return;
  }
  if (isDraggingText || isResizingText) {
    addToHistory();
  }
  isDraggingText = false;
  isResizingText = false;
}

function handleTextDoubleClick(e) {
  if (!isTextModeActive()) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  const clickedText = findTextAtPosition(x, y);
  if (clickedText) {
    selectedText = clickedText;
    document.getElementById('textInput').value = selectedText.text;
    document.getElementById('fontType').value = selectedText.fontFamily; // Set font family
    document.getElementById('textColor').value = selectedText.color;
    document.getElementById('fontSize').value = toAbsoluteFontSize(selectedText.relFontSize); // Set slider value
    document.getElementById('fontSizeValue').textContent = `${toAbsoluteFontSize(selectedText.relFontSize)}px`;
    updateTextButtonState();
    drawImageWithEffects();
  }
}

function handleTextKeyDown(e) {
  if (!isTextModeActive() || !selectedText || e.key !== 'Delete') {
    return;
  }
  
  const index = textObjects.indexOf(selectedText);
  if (index > -1) {
    textObjects.splice(index, 1);
    selectedText = null;
    updateTextButtonState();
    drawImageWithEffects();
    addToHistory();
  }
}

function findTextAtPosition(x, y) {
  if (!isTextModeActive()) {
    return null;
  }
  
  for (let i = textObjects.length - 1; i >= 0; i--) {
    const textObj = textObjects[i];
    if (isPointInText(x, y, textObj)) {
      return textObj;
    }
  }
  return null;
}

function isPointInText(x, y, textObj) {
  // Convert relative coordinates and font size to absolute for hit testing
  const absCoords = toAbsoluteCoords(textObj.relX, textObj.relY);
  const absFontSize = toAbsoluteFontSize(textObj.relFontSize);

  // Temporarily set font to measure text
  ctx.font = `${absFontSize}px ${textObj.fontFamily}`;
  const textWidth = ctx.measureText(textObj.text).width;
  const textHeight = absFontSize; // Approximate height for bounding box

  const textLeft = absCoords.x - textWidth / 2;
  const textRight = absCoords.x + textWidth / 2;
  const textTop = absCoords.y - textHeight / 2;
  const textBottom = absCoords.y + textHeight / 2;

  return x >= textLeft && x <= textRight && y >= textTop && y <= textBottom;
}

function isPointInDeleteButtonText(x, y, textObj) {
  if (!textObj) return false;

  // Get absolute coordinates and font size for current drawing
  const absCoords = toAbsoluteCoords(textObj.relX, textObj.relY);
  const absFontSize = toAbsoluteFontSize(textObj.relFontSize);

  ctx.font = `${absFontSize}px ${textObj.fontFamily}`;
  const textWidth = ctx.measureText(textObj.text).width;
  const textHeight = absFontSize;

  const padding = 3;
  const buttonSize = 20; // Size of the delete button

  const outlineX = absCoords.x - textWidth / 2 - padding;
  const outlineY = absCoords.y - textHeight / 2 - padding;
  const outlineW = textWidth + padding * 2;
  const outlineH = textHeight + padding * 2;

  // Delete button is at top-right corner of the bounding box
  const buttonX = outlineX + outlineW - buttonSize / 2;
  const buttonY = outlineY - buttonSize / 2;

  return x >= buttonX && x <= buttonX + buttonSize && y >= buttonY && y <= buttonY + buttonSize;
}


function isPointInResizeHandleText(x, y, textObj) {
  if (!textObj) return false;

  // Get absolute coordinates and font size for current drawing
  const absCoords = toAbsoluteCoords(textObj.relX, textObj.relY);
  const absFontSize = toAbsoluteFontSize(textObj.relFontSize);

  ctx.font = `${absFontSize}px ${textObj.fontFamily}`;
  const textWidth = ctx.measureText(textObj.text).width;
  const textHeight = absFontSize;

  const padding = 3;
  const handleSize = 10; // Size of the resize handle

  const outlineX = absCoords.x - textWidth / 2 - padding;
  const outlineY = absCoords.y - textHeight / 2 - padding;
  const outlineW = textWidth + padding * 2;
  const outlineH = textHeight + padding * 2;

  // Resize handle is at bottom-right corner of the bounding box
  const handleX = outlineX + outlineW - handleSize / 2;
  const handleY = outlineY + outlineH - handleSize / 2;

  return x >= handleX && x <= handleX + handleSize && y >= handleY && y <= handleY + handleSize;
}

function updateTextCursor(x, y) {
  if (!isTextModeActive()) {
    return;
  }

  let cursorChanged = false;
  for (let i = textObjects.length - 1; i >= 0; i--) {
    const textObj = textObjects[i];
    if (isPointInDeleteButtonText(x, y, textObj)) {
      canvas.style.cursor = 'pointer';
      cursorChanged = true;
      break;
    }
    if (isPointInResizeHandleText(x, y, textObj)) {
      canvas.style.cursor = 'nwse-resize';
      cursorChanged = true;
      break;
    }
    if (isPointInText(x, y, textObj)) {
      canvas.style.cursor = 'move';
      cursorChanged = true;
      break;
    }
  }

  if (!cursorChanged) {
    canvas.style.cursor = 'auto';
  }
}

let textAnimationFrameId = null;

function animateTextSelections() {
  if (isTextModeActive() && selectedText) {
    drawImageWithEffects(); // Redraw all effects including current selection animation
    textAnimationFrameId = requestAnimationFrame(animateTextSelections);
  } else {
    cancelAnimationFrame(textAnimationFrameId);
    textAnimationFrameId = null;
  }
}


function drawAllTexts() {
  if (textObjects.length === 0) return;

  textObjects.forEach(textObj => {
    // Convert relative to absolute coordinates and font size
    const absCoords = toAbsoluteCoords(textObj.relX, textObj.relY);
    const absFontSize = toAbsoluteFontSize(textObj.relFontSize);

    ctx.font = `${absFontSize}px ${textObj.fontFamily}`; // Use absolute font size and stored family
    ctx.fillStyle = textObj.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textObj.text, absCoords.x, absCoords.y);

    // Calculate dynamic width and height for selection/resizing
    textObj.currentWidth = ctx.measureText(textObj.text).width;
    textObj.currentHeight = absFontSize;

    // ENHANCED: Draw selection indicator if selected AND text mode is active
    if (textObj === selectedText && isTextModeActive()) {
      ctx.save();
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]); // Dashed line for selection

      const textWidth = textObj.currentWidth;
      const textHeight = textObj.currentHeight;

      const padding = 3;
      const cornerLineLength = 15; // Length of the corner lines

      const x = absCoords.x - textWidth / 2; // Use absolute coordinates for drawing outline
      const y = absCoords.y - textHeight / 2;

      const outlineX = x - padding;
      const outlineY = y - padding;
      const outlineW = textWidth + padding * 2;
      const outlineH = textHeight + padding * 2;

      // Draw dashed outline rectangle
      ctx.strokeRect(outlineX, outlineY, outlineW, outlineH);

      // Draw corner lines for visual emphasis
      ctx.setLineDash([]); // Solid lines for corners
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#4CAF50'; // Green

      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(outlineX, outlineY + cornerLineLength);
      ctx.lineTo(outlineX, outlineY);
      ctx.lineTo(outlineX + cornerLineLength, outlineY);
      ctx.stroke();

      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(outlineX + outlineW - cornerLineLength, outlineY);
      ctx.lineTo(outlineX + outlineW, outlineY);
      ctx.lineTo(outlineX + outlineW, outlineY + cornerLineLength);
      ctx.stroke();

      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(outlineX, outlineY + outlineH - cornerLineLength);
      ctx.lineTo(outlineX, outlineY + outlineH);
      ctx.lineTo(outlineX + cornerLineLength, outlineY + outlineH);
      ctx.stroke();

      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(outlineX + outlineW - cornerLineLength, outlineY + outlineH);
      ctx.lineTo(outlineX + outlineW, outlineY + outlineH);
      ctx.lineTo(outlineX + outlineW, outlineY + outlineH - cornerLineLength);
      ctx.stroke();

      // Reset global alpha
      ctx.globalAlpha = 1;

      // Draw resize handle (bottom-right)
      const handleSize = 10;
      ctx.fillStyle = '#4CA0FF'; // Blue handle
      ctx.fillRect(outlineX + outlineW - handleSize / 2, outlineY + outlineH - handleSize / 2, handleSize, handleSize);

      // Draw delete button (top-right)
      const buttonSize = 20;
      const deleteX = outlineX + outlineW - buttonSize / 2;
      const deleteY = outlineY - buttonSize / 2;
      const deleteRadius = buttonSize / 2;

      ctx.beginPath();
      ctx.arc(deleteX + deleteRadius, deleteY + deleteRadius, deleteRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(deleteX + deleteRadius * 0.7, deleteY + deleteRadius * 0.7);
      ctx.lineTo(deleteX + deleteRadius * 1.3, deleteY + deleteRadius * 1.3);
      ctx.moveTo(deleteX + deleteRadius * 1.3, deleteY + deleteRadius * 0.7);
      ctx.lineTo(deleteX + deleteRadius * 0.7, deleteY + deleteRadius * 1.3);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  });
}

// History management for text objects
function getTextObjectsState() {
  return JSON.stringify(textObjects.map(textObj => ({
    text: textObj.text,
    relX: textObj.relX, // Store relative X
    relY: textObj.relY, // Store relative Y
    relFontSize: textObj.relFontSize, // Store relative font size
    fontFamily: textObj.fontFamily, // Store font family
    color: textObj.color,
    // Do not store currentWidth and currentHeight as they are dynamic
  })));
}

function setTextObjectsState(state) {
  const loadedTextObjects = JSON.parse(state);
  textObjects = loadedTextObjects.map(obj => ({
    text: obj.text,
    relX: obj.relX, // Restore relative X
    relY: obj.relY, // Restore relative Y
    relFontSize: obj.relFontSize, // Restore relative font size
    fontFamily: obj.fontFamily, // Restore font family
    color: obj.color,
    isDragging: false, // Reset transient state
    isResizing: false, // Reset transient state
    currentWidth: 0, // Will be calculated on draw
    currentHeight: 0 // Will be calculated on draw
  }));
  selectedText = null; // Clear selection after loading state
  updateTextButtonState();
  drawImageWithEffects();
}

// Integrate with the existing history system
if (window.saveState) {
  const originalSaveState = window.saveState;
  window.saveState = function() {
    originalSaveState();
  };
}

if (window.restoreState) {
  const originalRestoreState = window.restoreState;
  window.restoreState = function(snapshot) {
    originalRestoreState(snapshot);
    const stateObj = JSON.parse(snapshot);
    if (stateObj && stateObj.textObjects) {
      setTextObjectsState(JSON.stringify(stateObj.textObjects));
    }
  };
}

// Create a combined snapshot for history
if (window.createSnapshot) {
  const originalCreateSnapshot = window.createSnapshot;
  window.createSnapshot = function() {
    const baseSnapshot = originalCreateSnapshot();
    const parsedSnapshot = JSON.parse(baseSnapshot);
    parsedSnapshot.textObjects = JSON.parse(getTextObjectsState()); // Add text objects to the snapshot
    return JSON.stringify(parsedSnapshot);
  };
} else {
  // Fallback if no existing createSnapshot
  window.createSnapshot = function() {
    return JSON.stringify({
      shapes: window.shapeObjects ? window.shapeObjects.map(shape => ({...shape})) : [],
      textObjects: JSON.parse(getTextObjectsState()),
      blurObjects: window.blurObjects ? window.blurObjects.map(blur => ({...blur})) : []
    });
  };
}