// Shapes functionality - Global variables and state management
let shapeObjects = [];
let selectedShape = null;
let isShapeMode = false;
let isDrawingShape = false;
let isMovingShape = false;
let isResizingShape = false;
let shapeStartX, shapeStartY; // Renamed from startX, startY to avoid conflicts
let activeShapeType = 'rectangle'; // Default shape type
let activeShapeColor = '#800080'; // Default shape color
let activeStrokeWidth = 4; // Default stroke width

// Modified shape functionality for tab-based UI
document.addEventListener('DOMContentLoaded', function() {
  // Replace the initShapes function to use tab button instead of checkbox
  window.initShapes = function() {
    // Bind the new tab button event
    const shapeTabBtn = document.getElementById('shapeTabBtn');
    if (shapeTabBtn) {
      shapeTabBtn.addEventListener('click', toggleShapeTab);
    }

    // Bind the existing shape tool controls
    document.getElementById('shapeType').addEventListener('change', handleShapeTypeChange);
    document.getElementById('shapeColor').addEventListener('input', handleShapeColorChange);
    document.getElementById('strokeWidth').addEventListener('input', handleStrokeWidthChange);

    // Initialize with default values
    document.getElementById('shapeType').value = activeShapeType;
    document.getElementById('shapeColor').value = activeShapeColor;
    document.getElementById('strokeWidth').value = activeStrokeWidth;

    // Add canvas event listeners for shape interaction
    addShapeEventListeners();
  };

  // New function to toggle the shape tab
  window.toggleShapeTab = function() {
    // Toggle shape mode state
    isShapeMode = !isShapeMode;

    // Toggle active class on the button
    const shapeTabBtn = document.getElementById('shapeTabBtn');
    if (isShapeMode) {
      shapeTabBtn.classList.add('active');
    } else {
      shapeTabBtn.classList.remove('active');
    }

    // Show/hide shape controls
    const shapeControlsDiv = document.getElementById('shapeControlsDiv');
    shapeControlsDiv.style.display = isShapeMode ? 'block' : 'none';

    // If entering shape mode, exit other modes
    if (isShapeMode) {
      // Exit text mode if it's active
      const textTabBtn = document.getElementById('textTabBtn');
      if (textTabBtn && textTabBtn.classList.contains('active')) {
        // Trigger a click on the text tab to close it
        textTabBtn.click();
      }

      // Exit blur mode if it's active
      const blurToggle = document.getElementById('blurToggle');
      if (blurToggle && blurToggle.checked) {
        blurToggle.checked = false;
        // Trigger the change event to update the state
        const event = new Event('change');
        blurToggle.dispatchEvent(event);
      }

      // Change cursor to indicate shape drawing mode
      document.getElementById('canvas').style.cursor = 'crosshair';
    } else {
      // Reset cursor when exiting shape mode
      document.getElementById('canvas').style.cursor = 'default';
      // Deselect any selected shape
      selectShape(null);
    }

    // Redraw the canvas to update the UI
    drawImageWithEffects();
  };

  // Handle clicking on the text tab to exit shape mode
  const textTabBtn = document.getElementById('textTabBtn');
  if (textTabBtn) {
    textTabBtn.addEventListener('click', function() {
      if (isShapeMode) {
        // Close shape mode when text mode is activated
        toggleShapeTab();
      }
    });
  }

  // Initialize shapes functionality
  if (typeof initShapes === 'function') {
    initShapes();
  }
});

// Add event listeners for shape interaction on the canvas
function addShapeEventListeners() {
  const canvas = document.getElementById('canvas');

  // Mouse down - start drawing or select shape
  canvas.addEventListener('mousedown', handleCanvasMouseDown);

  // Mouse move - drawing, moving or resizing shape
  canvas.addEventListener('mousemove', handleCanvasMouseMove);

  // Mouse up - finish drawing, moving or resizing
  canvas.addEventListener('mouseup', handleCanvasMouseUp);

  // Mouse leave - cancel operation if mouse leaves canvas
  canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
}

// Legacy toggleShapeMode function, kept for backward compatibility
function toggleShapeMode(e) {
  // This function is retained for compatibility, but we'll redirect to toggleShapeTab
  if (typeof window.toggleShapeTab === 'function') {
    window.toggleShapeTab();
  } else {
    // Fallback to original behavior if toggleShapeTab doesn't exist yet
    isShapeMode = e.target.checked;

    // Show/hide shape controls
    const shapeControlsDiv = document.getElementById('shapeControlsDiv');
    shapeControlsDiv.style.display = isShapeMode ? 'block' : 'none';

    // If entering shape mode, exit other modes
    if (isShapeMode) {
      // Exit blur mode if it's active
      const blurToggle = document.getElementById('blurToggle');
      if (blurToggle && blurToggle.checked) {
        blurToggle.checked = false;
        // Trigger the change event to update the state
        const event = new Event('change');
        blurToggle.dispatchEvent(event);
      }

      // Exit text mode if it's active (assuming text mode exists)
      if (typeof isTextMode !== 'undefined' && isTextMode) {
        // Reset text mode (implement as needed)
        isTextMode = false;
      }

      // Change cursor to indicate shape drawing mode
      document.getElementById('canvas').style.cursor = 'crosshair';
    } else {
      // Reset cursor when exiting shape mode
      document.getElementById('canvas').style.cursor = 'default';
      // Deselect any selected shape
      selectShape(null);
    }

    // Redraw the canvas to update the UI
    drawImageWithEffects();
  }
}

// Handle shape type change
function handleShapeTypeChange(e) {
  activeShapeType = e.target.value;
}

// Handle shape color change
function handleShapeColorChange(e) {
  activeShapeColor = e.target.value;

  // If a shape is selected, update its color
  if (selectedShape) {
    selectedShape.color = activeShapeColor;
    drawImageWithEffects();
  }
}

// Handle stroke width change
function handleStrokeWidthChange(e) {
  activeStrokeWidth = parseInt(e.target.value);

  // If a shape is selected, update its stroke width
  if (selectedShape) {
    selectedShape.strokeWidth = activeStrokeWidth;
    drawImageWithEffects();
  }
}

// Handle mouse down on canvas
function handleCanvasMouseDown(e) {
  if (!isShapeMode) return;

  // Get mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  // Check if clicking on the delete button when a shape is selected
  if (selectedShape && isPointInDeleteButton(x, y, selectedShape)) {
    deleteSelectedShape();
    return;
  }

  // Check if clicking on an existing shape
  const clickedShape = findShapeAtPosition(x, y);

  if (clickedShape) {
    // Select the clicked shape
    selectShape(clickedShape);

    // Check if clicking on the resize handle
    if (isPointInResizeHandle(x, y, clickedShape)) {
      isResizingShape = true;
    }
    // If clicking on the shape itself (not on resize handle), start moving
    else if (isPointInShape(x, y, clickedShape)) {
      isMovingShape = true;
    }

    shapeStartX = x;
    shapeStartY = y;
  } else {
    // Deselect current shape
    selectShape(null);

    // Just record the starting position but don't create a shape yet
    isDrawingShape = true;
    shapeStartX = x;
    shapeStartY = y;
    // We'll create the actual shape in mouseMove if the drag distance exceeds threshold
  }
}

// Handle mouse move on canvas
function handleCanvasMouseMove(e) {
  if (!isShapeMode) return;

  // Get mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  // If we're in drawing mode but no shape exists yet (first move after mousedown)
  if (isDrawingShape && !selectedShape) {
    const minThreshold = 5;
    const currentWidth = x - shapeStartX;
    const currentHeight = y - shapeStartY;

    if (Math.abs(currentWidth) > minThreshold || Math.abs(currentHeight) > minThreshold) {
      const relPos = toRelativeCoords(shapeStartX, shapeStartY);
      const relWidth = toRelativeSize(currentWidth);
      const relHeight = toRelativeSize(currentHeight);

      const newShape = {
        type: activeShapeType,
        relX: relPos.x,
        relY: relPos.y,
        relWidth: relWidth,
        relHeight: relHeight,
        color: activeShapeColor,
        strokeWidth: activeStrokeWidth
      };

      shapeObjects.push(newShape);
      selectShape(newShape);
    }
  } else if (isDrawingShape && selectedShape) {
    // Update shape dimensions based on mouse position
    const currentWidth = x - shapeStartX;
    const currentHeight = y - shapeStartY;

    selectedShape.relWidth = toRelativeSize(currentWidth);
    selectedShape.relHeight = toRelativeSize(currentHeight);

    // Redraw the canvas
    drawImageWithEffects();
  } else if (isMovingShape && selectedShape) {
    // Move the shape based on mouse movement
    const deltaX = x - shapeStartX;
    const deltaY = y - shapeStartY;

    const absPos = toAbsoluteCoords(selectedShape.relX, selectedShape.relY);
    const newAbsX = absPos.x + deltaX;
    const newAbsY = absPos.y + deltaY;

    const relPos = toRelativeCoords(newAbsX, newAbsY);
    selectedShape.relX = relPos.x;
    selectedShape.relY = relPos.y;

    shapeStartX = x;
    shapeStartY = y;

    // Redraw the canvas
    drawImageWithEffects();
  } else if (isResizingShape && selectedShape) {
    // Resize the shape based on mouse position
    const absX = toAbsoluteCoords(selectedShape.relX, selectedShape.relY).x;
    const absY = toAbsoluteCoords(selectedShape.relX, selectedShape.relY).y;

    const newWidth = x - absX;
    const newHeight = y - absY;

    selectedShape.relWidth = toRelativeSize(newWidth);
    selectedShape.relHeight = toRelativeSize(newHeight);

    // Redraw the canvas
    drawImageWithEffects();
  } else if (isShapeMode) {
    // Update cursor based on what's under the cursor
    updateCursor(x, y);
  }
}

// Handle mouse up on canvas
function handleCanvasMouseUp() {
  if (!isShapeMode) return;

  // Save state before ending operations
  if (isDrawingShape || isMovingShape || isResizingShape) {
    addToHistory();
  }

  // End all operations
  isDrawingShape = false;
  isMovingShape = false;
  isResizingShape = false;
}

// Handle mouse leave from canvas
function handleCanvasMouseLeave() {
  if (!isShapeMode) return;

  // Save state before ending operations
  if (isDrawingShape || isMovingShape || isResizingShape) {
    addToHistory();
  }

  // End all operations
  isDrawingShape = false;
  isMovingShape = false;
  isResizingShape = false;
}

// Update cursor based on what's under it
function updateCursor(x, y) {
  const canvas = document.getElementById('canvas');
  const hoveredShape = findShapeAtPosition(x, y);

  if (hoveredShape) {
    // If over delete button, show pointer cursor
    if (isPointInDeleteButton(x, y, hoveredShape)) {
      canvas.style.cursor = 'pointer';
    }
    // If over resize handle, show resize cursor
    else if (isPointInResizeHandle(x, y, hoveredShape)) {
      canvas.style.cursor = 'nwse-resize';
    }
    // If over the shape, show move cursor
    else if (isPointInShape(x, y, hoveredShape)) {
      canvas.style.cursor = 'move';
    }
    // Otherwise, use default shape cursor
    else {
      canvas.style.cursor = 'crosshair';
    }
  } else {
    // Use crosshair cursor when not over any shape
    canvas.style.cursor = 'crosshair';
  }
}

// Select or deselect a shape
function selectShape(shape) {
  selectedShape = shape;

  // Update the shape controls based on selected shape
  if (shape) {
    document.getElementById('shapeType').value = shape.type;
    document.getElementById('shapeColor').value = shape.color;
    document.getElementById('strokeWidth').value = shape.strokeWidth;
  }

  // Redraw the canvas to update the UI
  drawImageWithEffects();
}

// Delete the currently selected shape
function deleteSelectedShape() {
  if (!selectedShape) return;

  // Find and remove the selected shape from the array
  const index = shapeObjects.indexOf(selectedShape);
  if (index !== -1) {
    shapeObjects.splice(index, 1);
  }

  // Deselect the shape
  selectShape(null);

  // Add to history for undo/redo
  addToHistory();

  // Redraw the canvas
  drawImageWithEffects();
}

// Check if a point is inside a shape
function isPointInShape(x, y, shape) {
  const absCoords = toAbsoluteCoords(shape.relX, shape.relY);
  const absWidth = toAbsoluteSize(shape.relWidth);
  const absHeight = toAbsoluteSize(shape.relHeight);

  // Adjust coordinates for negative width/height
  const shapeX = absWidth > 0 ? absCoords.x : absCoords.x + absWidth;
  const shapeY = absHeight > 0 ? absCoords.y : absCoords.y + absHeight;
  const shapeW = Math.abs(absWidth);
  const shapeH = Math.abs(absHeight);

  switch (shape.type) {
    case 'rectangle':
    case 'roundedRect':
      return x >= shapeX && x <= shapeX + shapeW && y >= shapeY && y <= shapeY + shapeH;

    case 'circle':
      const centerX = shapeX + shapeW / 2;
      const centerY = shapeY + shapeH / 2;
      const radius = Math.min(shapeW, shapeH) / 2;

      return Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2) <= Math.pow(radius, 2);

    case 'ellipse':
      const ellipseCenterX = shapeX + shapeW / 2;
      const ellipseCenterY = shapeY + shapeH / 2;
      const radiusX = shapeW / 2;
      const radiusY = shapeH / 2;

      if (radiusX === 0 || radiusY === 0) return false;

      const normalizedX = (x - ellipseCenterX) / radiusX;
      const normalizedY = (y - ellipseCenterY) / radiusY;

      return Math.pow(normalizedX, 2) + Math.pow(normalizedY, 2) <= 1;

    case 'arrow':
      const startPointX = absCoords.x;
      const startPointY = absCoords.y;
      const endPointX = absCoords.x + absWidth;
      const endPointY = absCoords.y + absHeight;

      const lineLength = Math.sqrt(absWidth * absWidth + absHeight * absHeight);
      if (lineLength === 0) return false;

      const distance = Math.abs((endPointY - startPointY) * x - (endPointX - startPointX) * y + endPointX * startPointY - endPointY * startPointX) / lineLength;

      return distance <= 5;
  }

  return false;
}

// New function to check if a point is in the delete button
function isPointInDeleteButton(x, y, shape) {
  if (!shape) return false;

  const absCoords = toAbsoluteCoords(shape.relX, shape.relY);
  const absWidth = toAbsoluteSize(shape.relWidth);
  const absHeight = toAbsoluteSize(shape.relHeight);

  // Get shape coordinates (handling negative width/height)
  const shapeX = absWidth > 0 ? absCoords.x : absCoords.x + absWidth;
  const shapeY = absHeight > 0 ? absCoords.y : absCoords.y + absHeight;
  const shapeW = Math.abs(absWidth);
  const shapeH = Math.abs(absHeight);

  // Position delete button at top-right corner of selection outline
  const padding = 3;
  const buttonSize = 16;
  const buttonX = shapeX + shapeW + padding;
  const buttonY = shapeY - padding - buttonSize;

  return x >= buttonX && x <= buttonX + buttonSize &&
         y >= buttonY && y <= buttonY + buttonSize;
}

// Find a shape at the given position
function findShapeAtPosition(x, y) {
  // Search from the end (top-most shape) to the beginning
  for (let i = shapeObjects.length - 1; i >= 0; i--) {
    const shape = shapeObjects[i];

    if (isPointInShape(x, y, shape) ||
        isPointInResizeHandle(x, y, shape) ||
        (shape === selectedShape && isPointInDeleteButton(x, y, shape))) {
      return shape;
    }
  }

  return null;
}

// Check if point is in the resize handle of a shape
function isPointInResizeHandle(x, y, shape) {
  if (!shape) return false;

  const absCoords = toAbsoluteCoords(shape.relX, shape.relY);
  const absWidth = toAbsoluteSize(shape.relWidth);
  const absHeight = toAbsoluteSize(shape.relHeight);

  // For resize handle, use the shape's bottom-right corner
  const handleX = absWidth > 0 ? absCoords.x + absWidth : absCoords.x;
  const handleY = absHeight > 0 ? absCoords.y + absHeight : absCoords.y;

  // Resize handle size
  const handleSize = 10;

  return (x >= handleX && x <= handleX + handleSize &&
          y >= handleY && y <= handleY + handleSize);
}

// Draw all shapes on the canvas
function drawAllShapes() {
  const ctx = canvas.getContext('2d');

  // Draw each shape
  shapeObjects.forEach((shape, index) => {
    const isSelected = shape === selectedShape;
    drawShape(ctx, shape, isSelected);
  });
}


// Updated drawShape function with improved selection outline and delete button
function drawShape(ctx, shape, isSelected) {
  ctx.save();

  // Set shape styles
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;

  // Convert relative coordinates and dimensions to absolute
  const absCoords = toAbsoluteCoords(shape.relX, shape.relY);
  const absWidth = toAbsoluteSize(shape.relWidth);
  const absHeight = toAbsoluteSize(shape.relHeight);

  // Adjust coordinates for negative width/height
  const x = absWidth > 0 ? absCoords.x : absCoords.x + absWidth;
  const y = absHeight > 0 ? absCoords.y : absCoords.y + absHeight;
  const w = Math.abs(absWidth);
  const h = Math.abs(absHeight);

  // Draw the shape based on its type
  switch (shape.type) {
    case 'rectangle':
      ctx.strokeRect(x, y, w, h);
      break;

    case 'roundedRect':
      // Calculate corner radius (minimum 5, maximum 20% of smaller dimension)
      const cornerRadius = Math.min(20, Math.max(5, Math.min(w, h) * 0.2));

      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + w - cornerRadius, y);
      ctx.arcTo(x + w, y, x + w, y + cornerRadius, cornerRadius);
      ctx.lineTo(x + w, y + h - cornerRadius);
      ctx.arcTo(x + w, y + h, x + w - cornerRadius, y + h, cornerRadius);
      ctx.lineTo(x + cornerRadius, y + h);
      ctx.arcTo(x, y + h, x, y + h - cornerRadius, cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
      ctx.closePath();
      ctx.stroke();
      break;

    case 'circle':
      const radius = Math.min(w, h) / 2;
      const centerX = x + w / 2;
      const centerY = y + h / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      break;

    case 'ellipse':
      const ellipseCenterX = x + w / 2;
      const ellipseCenterY = y + h / 2;
      const radiusX = w / 2;
      const radiusY = h / 2;

      ctx.beginPath();
      ctx.ellipse(ellipseCenterX, ellipseCenterY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      break;

    case 'arrow':
      const startPointX = absCoords.x;
      const startPointY = absCoords.y;
      const endPointX = absCoords.x + absWidth;
      const endPointY = absCoords.y + absHeight;

      // Arrow body
      ctx.beginPath();
      ctx.moveTo(startPointX, startPointY);
      ctx.lineTo(endPointX, endPointY);
      ctx.stroke();

      // Arrow head
      const headLength = Math.min(20, Math.sqrt(absWidth * absWidth + absHeight * absHeight) / 3);
      const angle = Math.atan2(endPointY - startPointY, endPointX - startPointX);

      ctx.beginPath();
      ctx.moveTo(endPointX, endPointY);
      ctx.lineTo(
        endPointX - headLength * Math.cos(angle - Math.PI / 6),
        endPointY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endPointX, endPointY);
      ctx.lineTo(
        endPointX - headLength * Math.cos(angle + Math.PI / 6),
        endPointY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      break;
  }

  // Draw enhanced selection if the shape is selected
  if (isSelected) {
    // Calculate padding for the selection outline
    const padding = 3;

    // Draw subtle glow effect
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(41, 128, 255, 0.4)';
    ctx.strokeStyle = 'rgba(41, 128, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - padding, y - padding, w + padding * 2, h + padding * 2);

    // Reset shadow for the corner indicators
    ctx.shadowBlur = 0;

    // Draw corner indicators instead of full outline
    const cornerSize = 8;
    const cornerLineLength = 12;

    // Corner indicator color
    ctx.strokeStyle = '#2980ff';
    ctx.lineWidth = 2;

    // Animated corner effects
    const timestamp = Date.now();
    const pulseAmount = Math.sin(timestamp / 400) * 0.3 + 0.7; // Pulsing effect
    ctx.globalAlpha = 0.7 + 0.3 * pulseAmount;

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(x - padding, y - padding + cornerLineLength);
    ctx.lineTo(x - padding, y - padding);
    ctx.lineTo(x - padding + cornerLineLength, y - padding);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(x + w + padding - cornerLineLength, y - padding);
    ctx.lineTo(x + w + padding, y - padding);
    ctx.lineTo(x + w + padding, y - padding + cornerLineLength);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(x - padding, y + h + padding - cornerLineLength);
    ctx.lineTo(x - padding, y + h + padding);
    ctx.lineTo(x - padding + cornerLineLength, y + h + padding);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(x + w + padding - cornerLineLength, y + h + padding);
    ctx.lineTo(x + w + padding, y + h + padding);
    ctx.lineTo(x + w + padding, y + h + padding - cornerLineLength);
    ctx.stroke();

    // Reset global alpha
    ctx.globalAlpha = 1;

    // Draw resize handle (bottom-right)
    ctx.fillStyle = '#4CA0FF';
    ctx.fillRect(x + w, y + h, 10, 10);
    ctx.strokeStyle = '#0066CC';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + w, y + h, 10, 10);

    // NEW: Draw delete button (X) at top-right corner
    const buttonSize = 16;
    const buttonX = x + w + padding;
    const buttonY = y - padding - buttonSize;

    // Draw delete button background
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(buttonX + buttonSize/2, buttonY + buttonSize/2, buttonSize/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw X
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    const margin = 4;

    ctx.beginPath();
    ctx.moveTo(buttonX + margin, buttonY + margin);
    ctx.lineTo(buttonX + buttonSize - margin, buttonY + buttonSize - margin);
    ctx.moveTo(buttonX + buttonSize - margin, buttonY + margin);
    ctx.lineTo(buttonX + margin, buttonY + buttonSize - margin);
    ctx.stroke();
  }

  ctx.restore();
}

// Add a requestAnimationFrame loop to animate selection outlines
let animationFrameId = null;

function animateSelections() {
  if (selectedShape) {
    drawImageWithEffects();
  }
  animationFrameId = requestAnimationFrame(animateSelections);
}

// Update the selectShape function to start/stop animation as needed
const originalSelectShape = selectShape;
selectShape = function(shape) {
  originalSelectShape(shape);

  // Start animation if a shape is selected, stop it otherwise
  if (shape) {
    if (!animationFrameId) {
      animateSelections();
    }
  } else {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
};

// Make sure to cancel animation when exiting shape mode
const originalToggleShapeMode = toggleShapeMode;
toggleShapeMode = function(e) {
  originalToggleShapeMode(e);

  if (!isShapeMode && animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

// Extend the original drawImageWithEffects function to draw shapes
// Use a different approach to avoid redeclaring originalDrawImageWithEffects
if (window.drawImageWithEffects) {
  const tempDrawImageWithEffects = window.drawImageWithEffects;

  window.drawImageWithEffects = function() {
    // Call the original function first
    tempDrawImageWithEffects();

    // Then draw shapes on top
    if (typeof drawAllShapes === 'function') {
      drawAllShapes();
    }
  };
} else {
  window.drawImageWithEffects = function() {
    // If the original function doesn't exist yet, just draw shapes
    if (typeof drawAllShapes === 'function') {
      drawAllShapes();
    }
  };
}

// Add shapes to the history management system
function addToHistory() {
  if (typeof saveState === 'function') {
    saveState();
  }
}

// Create a snapshot of the current state for history
function createSnapshot() {
  return JSON.stringify({
    shapes: shapeObjects.map(shape => ({...shape}))
  });
}

// Apply a snapshot from history
function applySnapshot(snapshot) {
  if (!snapshot) return;

  try {
    const state = JSON.parse(snapshot);
    if (state.shapes) {
      shapeObjects = state.shapes.map(shape => ({...shape}));
      selectedShape = null;
      drawImageWithEffects();
    }
  } catch (e) {
    console.error("Error applying snapshot:", e);
  }
}

// Add integration with the existing history system
if (typeof saveState === 'function') {
  const originalSaveState = window.saveState;

  window.saveState = function(snapshot) { // Ensure snapshot argument is passed
    const currentShapesSnapshot = createSnapshot();
    // This assumes saveState handles merging snapshots or you want shapes to be a separate history item
    // For now, we'll just call the original saveState. You might need to adjust saveState to handle multiple types of history
    originalSaveState(currentShapesSnapshot);
  };
}

if (typeof restoreState === 'function') {
  const originalRestoreState = window.restoreState;

  window.restoreState = function(snapshot) {
    originalRestoreState(snapshot);
    applySnapshot(snapshot);
  };
}