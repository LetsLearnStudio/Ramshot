// eventHandlers.js - Handles all event bindings that were previously inline in HTML

document.addEventListener('DOMContentLoaded', function() {
  // Bind color controls
  const randomColorsBtn = document.getElementById('randomColorsBtn');
  if (randomColorsBtn) {
    randomColorsBtn.addEventListener('click', randomizeColors);
  }

  const flipColorsBtn = document.getElementById('flipColorsBtn');
  if (flipColorsBtn) {
    flipColorsBtn.addEventListener('click', flipColors);
  }

  // Bind blur toggle
  const blurToggle = document.getElementById('blurToggle');
  if (blurToggle) {
    blurToggle.addEventListener('click', toggleBlurMode);
  }

  // Bind actions
  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn) {
    undoBtn.addEventListener('click', undo);
  }

  const redoBtn = document.getElementById('redoBtn');
  if (redoBtn) {
    redoBtn.addEventListener('click', redo);
  }

  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadImage);
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetCanvas);
  }

  // Initialize any other event bindings that might be required
  // This ensures all event bindings happen after the DOM is fully loaded
});