// Tools Tabs Management
document.addEventListener('DOMContentLoaded', function() {
  // Get all tab buttons
  const blurTabBtn = document.getElementById('blurTabBtn');
  const textTabBtn = document.getElementById('textTabBtn');
  const shapeTabBtn = document.getElementById('shapeTabBtn');
  
  // Get all content divs
  const blurIntensityDiv = document.getElementById('blurIntensityDiv');
  const shapeDiv = document.getElementById('shapeDiv');  
  const textControlsDiv = document.getElementById('textControlsDiv');
  const shapeControlsDiv = document.getElementById('shapeControlsDiv');
  
  // Store all tabs and their content in arrays for easier management
  const tabButtons = [blurTabBtn, textTabBtn, shapeTabBtn];
  // Note: shapeDiv is also included here as it's part of the blur tool's UI
  const contentDivs = [blurIntensityDiv, shapeDiv, textControlsDiv, shapeControlsDiv];
  
  // State management - make this available globally
  window.toolsState = {
    isBlurMode: false,
    isTextMode: false,
    isShapeMode: false
  };
  
  // Function to activate a tab and deactivate others
  function activateTab(activeTabButton, activeContentDiv, activeMode) {
    // First handle deactivation of previous tools
    if (window.toolsState.isBlurMode && activeMode !== 'isBlurMode') {
      // Deactivate blur tool if it was active
      if (window.blurToolFunctions && typeof window.blurToolFunctions.deactivate === 'function') {
        window.blurToolFunctions.deactivate();
      }
    }
    
    if (window.toolsState.isTextMode && activeMode !== 'isTextMode') {
      // Deactivate text tool if it was active
      if (typeof cancelAnimationFrame === 'function' && window.textAnimationFrameId) {
        cancelAnimationFrame(window.textAnimationFrameId);
        window.textAnimationFrameId = null;
      }
      
      // Clear text selection and reset text state
      if (typeof window.selectedText !== 'undefined') {
        window.selectedText = null;
      }
      if (typeof selectedText !== 'undefined') {
        selectedText = null;
      }
      
      // Reset text interaction flags
      if (typeof window.isDraggingText !== 'undefined') {
        window.isDraggingText = false;
      }
      if (typeof isDraggingText !== 'undefined') {
        isDraggingText = false;
      }
      
      if (typeof window.isResizingText !== 'undefined') {
        window.isResizingText = false;
      }
      if (typeof isResizingText !== 'undefined') {
        isResizingText = false;
      }
      
      // Update text button state if the function exists
      if (typeof updateTextButtonState === 'function') {
        updateTextButtonState();
      }
    }
    
    if (window.toolsState.isShapeMode && activeMode !== 'isShapeMode') {
      // Deactivate shape tool if it was active
      if (typeof cancelAnimationFrame === 'function' && window.shapeAnimationFrameId) {
        cancelAnimationFrame(window.shapeAnimationFrameId);
        window.shapeAnimationFrameId = null;
      }
      
      // NEW: Explicitly exit shape mode from the shapes.js module
      if (typeof toggleShapeTab === 'function' && typeof isShapeMode !== 'undefined' && isShapeMode === true) {
        toggleShapeTab();
      }
    }

    // Update all tab buttons
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Hide all content divs
    contentDivs.forEach(div => {
      if (div) div.style.display = 'none';
    });
    
    // Reset all mode flags - both in toolsState and global variables
    window.toolsState.isBlurMode = false;
    window.toolsState.isTextMode = false;
    window.toolsState.isShapeMode = false;
    
    // Reset global mode variables that other scripts depend on
    if (typeof window.isBlurMode !== 'undefined') window.isBlurMode = false;
    if (typeof window.isTextMode !== 'undefined') window.isTextMode = false;
    if (typeof window.isShapeMode !== 'undefined') window.isShapeMode = false;
    
    // If there's an active tab to set
    if (activeTabButton) {
      // Activate the selected tab
      activeTabButton.classList.add('active');
      if (activeContentDiv) activeContentDiv.style.display = 'block';
      
      // Special case: When blur mode is activated, also show the shape selection div
      if (activeMode === 'isBlurMode' && shapeDiv) {
        shapeDiv.style.display = 'block';
      }
      
      // Set active mode flag if an active mode is specified
      if (activeMode) {
        window.toolsState[activeMode] = true;
        
        // Also set the global variables that other scripts depend on
        if (activeMode === 'isBlurMode' && typeof window.isBlurMode !== 'undefined') {
          window.isBlurMode = true;
        } else if (activeMode === 'isTextMode' && typeof window.isTextMode !== 'undefined') {
          window.isTextMode = true;
        } else if (activeMode === 'isShapeMode' && typeof window.isShapeMode !== 'undefined') {
          window.isShapeMode = true;
        }
      }
      
      // Activate the appropriate tool functionality
      if (activeMode === 'isBlurMode') {
        // Activate blur tool
        if (window.blurToolFunctions && typeof window.blurToolFunctions.activate === 'function') {
          window.blurToolFunctions.activate();
        }
      } else if (activeMode === 'isTextMode') {
        // Activate text animations
        if (typeof animateTextSelections === 'function' && !window.textAnimationFrameId) {
          animateTextSelections();
        }
      } else if (activeMode === 'isShapeMode') {
        // Activate shape animations
        if (typeof animateShapeSelections === 'function' && !window.shapeAnimationFrameId) {
          animateShapeSelections();
        }
        
        // NEW: Make sure shapes.js isShapeMode is in sync with ours
        if (typeof toggleShapeTab === 'function' && typeof isShapeMode !== 'undefined' && isShapeMode === false) {
          toggleShapeTab();
        }
      }
    }
    
    // Set canvas cursor appropriately
    const canvas = document.getElementById('canvas');
    if (canvas) {
      if (activeMode === 'isTextMode') {
        canvas.style.cursor = 'auto';
      } else {
        canvas.style.cursor = 'default';
      }
    }
    
    // Refresh canvas if needed
    if (typeof drawImageWithEffects === 'function') {
      drawImageWithEffects();
    }
  }
  
  // Set up event handlers for each tab
  blurTabBtn.addEventListener('click', function() {
    // Toggle the blur mode if it's already active
    if (window.toolsState.isBlurMode) {
      activateTab(null, null, null);
    } else {
      activateTab(blurTabBtn, blurIntensityDiv, 'isBlurMode');
    }
  });
  
  textTabBtn.addEventListener('click', function() {
    // Toggle the text mode if it's already active
    if (window.toolsState.isTextMode) {
      activateTab(null, null, null);
    } else {
      activateTab(textTabBtn, textControlsDiv, 'isTextMode');
    }
  });
  
  shapeTabBtn.addEventListener('click', function() {
    // Toggle the shape mode if it's already active
    if (window.toolsState.isShapeMode) {
      activateTab(null, null, null);
    } else {
      activateTab(shapeTabBtn, shapeControlsDiv, 'isShapeMode');
    }
  });
  
  // Initialize with no tab active by default
  activateTab(null, null, null);
  
  // Make the activation function globally available so other scripts can use it
  window.activateToolTab = function(tabName) {
    switch(tabName) {
      case 'blur':
        activateTab(blurTabBtn, blurIntensityDiv, 'isBlurMode');
        break;
      case 'text':
        activateTab(textTabBtn, textControlsDiv, 'isTextMode');
        break;
      case 'shape':
        activateTab(shapeTabBtn, shapeControlsDiv, 'isShapeMode');
        break;
      case 'none':
        activateTab(null, null, null);
        break;
    }
  };
});