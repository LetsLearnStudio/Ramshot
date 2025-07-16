function initializeColorControls() {
  console.log("Initializing color controls");
  
  const color1 = document.getElementById('color1');
  const color2 = document.getElementById('color2');
  const gradientType = document.getElementById('gradientType');
  
  if (!color1 || !color2 || !gradientType) {
    console.error("Color controls not found!", {
      color1: !!color1,
      color2: !!color2,
      gradientType: !!gradientType
    });
    // Try again after a short delay if elements aren't available yet
    setTimeout(initializeColorControls, 100);
    return;
  }

  // Initialize gradient angle - Default to 135 degrees (matches the presets)
  window.gradientAngle = 135;

  // Color functions
  function randomizeColors() {
    console.log("Randomizing colors");
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function hslToHex(h, s, l) {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    }

    function generateHarmonizedColors() {
      const baseHue = getRandomInt(0, 360);
      const schemes = [
        () => [
          { h: baseHue, s: getRandomInt(60, 90), l: getRandomInt(30, 60) },
          { h: (baseHue + 180) % 360, s: getRandomInt(60, 90), l: getRandomInt(30, 60) }
        ],
        () => [
          { h: (baseHue - 30 + 360) % 360, s: getRandomInt(60, 90), l: getRandomInt(30, 60) },
          { h: baseHue, s: getRandomInt(60, 90), l: getRandomInt(30, 60) }
        ],
        () => [
          { h: baseHue, s: getRandomInt(60, 90), l: getRandomInt(30, 60) },
          { h: (baseHue + 120) % 360, s: getRandomInt(60, 90), l: getRandomInt(30, 60) }
        ]
      ];
      return schemes[getRandomInt(0, schemes.length - 1)]();
    }

    const [color1HSL, color2HSL] = generateHarmonizedColors();
    color1.value = hslToHex(color1HSL.h, color1HSL.s, color1HSL.l);
    color2.value = hslToHex(color2HSL.h, color2HSL.s, color2HSL.l);
    if (typeof drawImageWithEffects === 'function') {
      drawImageWithEffects();
    } else {
      console.error("drawImageWithEffects is not available!");
    }
  }

  function flipColors() {
    console.log("Flipping colors");
    // Swap color values
    const temp = color1.value;
    color1.value = color2.value;
    color2.value = temp;
    
    // Reverse gradient direction logic
    if (gradientType.value === 'linear') {
      // Force redraw with swapped gradient direction
      const tempType = gradientType.value;
      gradientType.value = 'radial';
      gradientType.value = tempType;
    }
    
    if (typeof drawImageWithEffects === 'function') {
      drawImageWithEffects();
    } else {
      console.error("drawImageWithEffects is not available!");
    }
  }

  // New function for rotating the gradient angle
  function rotateGradientAngle() {
    console.log("Rotating gradient angle");
    // Increment the angle by 30 degrees
    window.gradientAngle = (window.gradientAngle + 30);
    console.log("New gradient angle:", window.gradientAngle);
    
    // Only redraw if it's a linear gradient (angles don't affect radial gradients)
    if (gradientType.value === 'linear' && typeof drawImageWithEffects === 'function') {
      drawImageWithEffects();
    }
  }

  // Make these functions available globally
  window.randomizeColors = randomizeColors;
  window.flipColors = flipColors;
  window.rotateGradientAngle = rotateGradientAngle;

  // Add event listeners directly to controls
  color1.addEventListener('input', function() {
    console.log("Color 1 changed to", color1.value);
    if (typeof drawImageWithEffects === 'function') {
      drawImageWithEffects();
    }
  });
  
  color2.addEventListener('input', function() {
    console.log("Color 2 changed to", color2.value);
    if (typeof drawImageWithEffects === 'function') {
      drawImageWithEffects();
    }
  });
  
  gradientType.addEventListener('change', function() {
    console.log("Gradient type changed to", gradientType.value);
    if (typeof drawImageWithEffects === 'function') {
      drawImageWithEffects();
    }
  });

  // Setup preset click handlers
  console.log("Setting up preset handlers");
  const presets = document.querySelectorAll('.gradient-presets .preset');
  console.log(`Found ${presets.length} presets`);
  
  presets.forEach((preset, index) => {
    preset.addEventListener('click', function() {
      console.log(`Preset ${index + 1} clicked`);
      
      // Special handling for transparent preset
      if (preset.classList.contains('transparent-preset')) {
        console.log("Transparent preset selected");
        color1.value = '#ffffff';
        color2.value = '#ffffff';
        // Set a flag to indicate transparency is enabled
        window.isTransparentBackground = true;
        
        if (typeof drawImageWithEffects === 'function') {
          drawImageWithEffects();
        }
        return;
      }
      
      // Clear transparency flag for regular presets
      window.isTransparentBackground = false;
      
      const computedStyle = getComputedStyle(this);
      const gradient = computedStyle.backgroundImage;
      console.log("Detected gradient:", gradient);
      
      // Extract colors from gradient string - enhanced regex to handle both hex and rgb formats
      let colors = gradient.match(/#[0-9a-f]{3,6}/gi); // Try hex format first
      
      if (!colors || colors.length < 2) {
        // If hex colors aren't found, try rgb/rgba format
        const rgbMatches = gradient.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi);
        if (rgbMatches && rgbMatches.length >= 2) {
          // Convert RGB to hex
          colors = rgbMatches.map(rgb => {
            const nums = rgb.match(/\d+/g);
            if (nums && nums.length === 3) {
              return '#' + 
                parseInt(nums[0]).toString(16).padStart(2, '0') +
                parseInt(nums[1]).toString(16).padStart(2, '0') +
                parseInt(nums[2]).toString(16).padStart(2, '0');
            }
            return null;
          }).filter(color => color !== null);
        }
      }
      
      console.log("Extracted colors:", colors);
      
      if (colors && colors.length >= 2) {
        color1.value = colors[0];
        color2.value = colors[1];
        console.log(`Applied colors: ${colors[0]}, ${colors[1]}`);
        
        // Reset gradient angle to 45 degrees when selecting a preset (to match the preset style)
        window.gradientAngle = 45;
        
        if (typeof drawImageWithEffects === 'function') {
          drawImageWithEffects();
        } else {
          console.error("drawImageWithEffects is not available!");
        }
      } else {
        console.error("Failed to extract colors from gradient:", gradient);
      }
    });
  });

  // Also connect the randomize and flip buttons if they exist
  const randomColorsBtn = document.getElementById('randomColorsBtn');
  if (randomColorsBtn) {
    console.log("Found randomize button, attaching handler");
    randomColorsBtn.addEventListener('click', randomizeColors);
  }

  const flipColorsBtn = document.getElementById('flipColorsBtn');
  if (flipColorsBtn) {
    console.log("Found flip button, attaching handler");
    flipColorsBtn.addEventListener('click', flipColors);
  }

  // Connect the new rotate gradient angle button
  const rotateGradientBtn = document.getElementById('rotateGradientBtn');
  if (rotateGradientBtn) {
    console.log("Found rotate gradient button, attaching handler");
    rotateGradientBtn.addEventListener('click', rotateGradientAngle);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing color controls");
  initializeColorControls();
});