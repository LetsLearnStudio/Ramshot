//mask.js
window.mask = {
  type: 'rectangle',
  size: 100, // Changed from 80 to 100 for maximum size
  ratio: 1,
  positionX: 50,
  positionY: 50,
  cornerRadius: 0,
  borderStyle: 'solid',
  borderThickness: 0,
  borderColor: '#000000',
  borderMargin: 10 // Margin between mask edge and border (in pixels)
};

// Initialize mask controls
function initMaskControls() {
  const maskType = document.getElementById('maskType');
  const maskSize = document.getElementById('maskSize');
  const maskRatio = document.getElementById('maskRatio');
  const maskPositionX = document.getElementById('maskPositionX');
  const maskPositionY = document.getElementById('maskPositionY');
  const maskCornerRadius = document.getElementById('maskCornerRadius');
  const ellipseControls = document.getElementById('ellipseControls');
  const cornerRadiusControls = document.getElementById('cornerRadiusControls');
  
  // Border controls
  const maskBorderStyle = document.getElementById('maskBorderStyle');
  const maskBorderThickness = document.getElementById('maskBorderThickness');
  const maskBorderColor = document.getElementById('maskBorderColor');
  const maskBorderMargin = document.getElementById('maskBorderMargin');
  const borderControls = document.getElementById('borderControls');

  // Set default value for mask type (rectangle)
  if (maskType) {
    maskType.value = 'rectangle';
  }

  // Set default value for mask size input
  if (maskSize) {
    maskSize.value = 100; // Set the input field to match the default
  }

  // Set default value for corner radius input
  if (maskCornerRadius) {
    maskCornerRadius.value = 0;
  }

  // Set default values for border controls
  if (maskBorderStyle) {
    maskBorderStyle.value = 'solid';
  }
  if (maskBorderThickness) {
    maskBorderThickness.value = 0;
  }
  if (maskBorderColor) {
    maskBorderColor.value = '#000000';
  }
  if (maskBorderMargin) {
    maskBorderMargin.value = 10;
  }

  // Initialize UI state for rectangle mask (default)
  if (borderControls) {
    borderControls.style.display = 'none'; // Or 'flex' if it's a flex container
  }
  
  // Hide ellipse-specific controls (since rectangle is default)
  if (ellipseControls) {
    ellipseControls.style.display = 'none';
  }
  
  // Show corner radius controls for rectangle (since it's roundable)
  if (cornerRadiusControls) {
    cornerRadiusControls.style.display = 'flex';
  }

  // Handle mask type change
  maskType.addEventListener('change', function() {
    window.mask.type = this.value;
    
      if (borderControls) borderControls.style.display = 'block';
      
      // Show/hide ellipse-specific controls
      if (this.value === 'ellipse') {
        ellipseControls.style.display = 'none';
      } else {
        ellipseControls.style.display = 'none';
      }

      // Show/hide corner radius controls for applicable shapes
      const roundableShapes = ['rectangle', 'diamond', 'pentagon', 'hexagon'];
      if (roundableShapes.includes(this.value)) {
        cornerRadiusControls.style.display = 'flex';
      } else {
        cornerRadiusControls.style.display = 'flex';
      }
    
    drawImageWithEffects();
  });

  // Handle size change
  maskSize.addEventListener('input', function() {
    window.mask.size = parseInt(this.value);
    drawImageWithEffects();
  });

  // Handle ratio change (for ellipse)
  maskRatio.addEventListener('input', function() {
    window.mask.ratio = parseFloat(this.value);
    drawImageWithEffects();
  });

  // Handle corner radius change
  if (maskCornerRadius) {
    maskCornerRadius.addEventListener('input', function() {
      window.mask.cornerRadius = parseInt(this.value);
      drawImageWithEffects();
    });
  }

  // Handle position changes
  maskPositionX.addEventListener('input', function() {
    window.mask.positionX = parseInt(this.value);
    drawImageWithEffects();
  });

  maskPositionY.addEventListener('input', function() {
    window.mask.positionY = parseInt(this.value);
    drawImageWithEffects();
  });

  // Handle border controls
  if (maskBorderStyle) {
    maskBorderStyle.addEventListener('change', function() {
      window.mask.borderStyle = this.value;
      drawImageWithEffects();
    });
  }

  if (maskBorderThickness) {
    maskBorderThickness.addEventListener('input', function() {
      window.mask.borderThickness = parseInt(this.value);
      drawImageWithEffects();
    });
  }

  if (maskBorderColor) {
    maskBorderColor.addEventListener('input', function() {
      window.mask.borderColor = this.value;
      drawImageWithEffects();
    });
  }

  if (maskBorderMargin) {
    maskBorderMargin.addEventListener('input', function() {
      window.mask.borderMargin = parseInt(this.value);
      drawImageWithEffects();
    });
  }
}

// Helper function to draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (radius === 0) {
    ctx.rect(x, y, width, height);
    return;
  }
  
  // Clamp radius to prevent overlapping
  radius = Math.min(radius, width / 2, height / 2);
  
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

// Helper function to draw rounded polygon
function drawRoundedPolygon(ctx, points, centerX, centerY, radius) {
  if (radius === 0 || points.length < 3) {
    // Draw regular polygon
    for (let i = 0; i < points.length; i++) {
      const x = centerX + points[i].x;
      const y = centerY + points[i].y;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    return;
  }

  // Calculate maximum allowed radius based on shortest edge
  let minDistance = Infinity;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const distance = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));
    minDistance = Math.min(minDistance, distance);
  }
  radius = Math.min(radius, minDistance / 3);

  // Draw rounded polygon
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];
    
    // Calculate vectors
    const prevVec = { x: current.x - prev.x, y: current.y - prev.y };
    const nextVec = { x: next.x - current.x, y: next.y - current.y };
    
    // Normalize vectors
    const prevLen = Math.sqrt(prevVec.x * prevVec.x + prevVec.y * prevVec.y);
    const nextLen = Math.sqrt(nextVec.x * nextVec.x + nextVec.y * nextVec.y);
    
    const prevUnit = { x: prevVec.x / prevLen, y: prevVec.y / prevLen };
    const nextUnit = { x: nextVec.x / nextLen, y: nextVec.y / nextLen };
    
    // Calculate control points
    const cp1 = {
      x: centerX + current.x - prevUnit.x * radius,
      y: centerY + current.y - prevUnit.y * radius
    };
    const cp2 = {
      x: centerX + current.x + nextUnit.x * radius,
      y: centerY + current.y + nextUnit.y * radius
    };
    
    if (i === 0) {
      ctx.moveTo(cp1.x, cp1.y);
    } else {
      ctx.lineTo(cp1.x, cp1.y);
    }
    
    // Draw rounded corner
    ctx.quadraticCurveTo(
      centerX + current.x, 
      centerY + current.y, 
      cp2.x, 
      cp2.y
    );
  }
  ctx.closePath();
}

// Helper function to set canvas dash pattern based on border style
function setBorderStyle(ctx, style, thickness) {
  switch (style) {
    case 'solid':
      ctx.setLineDash([]);
      break;
    case 'dashed':
      ctx.setLineDash([thickness * 3, thickness * 2]);
      break;
    case 'dotted':
      ctx.setLineDash([thickness, thickness]);
      break;
    case 'double':
      // Double border will be handled differently - we'll draw two separate borders
      ctx.setLineDash([]);
      break;
    default:
      ctx.setLineDash([]);
  }
}

// Helper function to create mask path (used by both main mask and shadow)
function createMaskPath(ctx, offsetX, offsetY, imageWidth, imageHeight, forShadow = false, borderOffset = 0) {

  // Calculate mask dimensions and position
  const maskSizePercent = window.mask.size / 100;
  const centerX = offsetX + (imageWidth * window.mask.positionX / 100);
  const centerY = offsetY + (imageHeight * window.mask.positionY / 100);

  // Create the mask path
  ctx.beginPath();

  switch (window.mask.type) {
    case 'rectangle':
      // Calculate rectangle dimensions
      const rectWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const rectHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      
      const rectLeft = centerX - rectWidth / 2;
      const rectTop = centerY - rectHeight / 2;
      
      // Use rounded rectangle function
      const rectRadius = (window.mask.cornerRadius / 100) * Math.min(rectWidth, rectHeight) * 0.5;
      drawRoundedRect(ctx, rectLeft, rectTop, rectWidth, rectHeight, rectRadius);
      break;

      case 'diagonal-corners':
      // Rectangle with two diagonally opposite corners rounded
      const diagWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const diagHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      
      const diagLeft = centerX - diagWidth / 2;
      const diagTop = centerY - diagHeight / 2;
      const diagRight = diagLeft + diagWidth;
      const diagBottom = diagTop + diagHeight;
      
      // Calculate corner radius
      const diagRadius = (window.mask.cornerRadius / 100) * Math.min(diagWidth, diagHeight) * 0.5;
      const clampedRadius = Math.min(diagRadius, diagWidth / 2, diagHeight / 2);
      
      // Draw shape with top-left and bottom-right corners rounded
      ctx.moveTo(diagLeft + clampedRadius, diagTop);
      ctx.lineTo(diagRight, diagTop); // Top edge - straight to top-right (sharp corner)
      ctx.lineTo(diagRight, diagBottom - clampedRadius); // Right edge
      
      if (clampedRadius > 0) {
        // Bottom-right rounded corner
        ctx.quadraticCurveTo(diagRight, diagBottom, diagRight - clampedRadius, diagBottom);
      } else {
        ctx.lineTo(diagRight, diagBottom);
      }
      
      ctx.lineTo(diagLeft, diagBottom); // Bottom edge - straight to bottom-left (sharp corner)
      ctx.lineTo(diagLeft, diagTop + clampedRadius); // Left edge
      
      if (clampedRadius > 0) {
        // Top-left rounded corner
        ctx.quadraticCurveTo(diagLeft, diagTop, diagLeft + clampedRadius, diagTop);
      } else {
        ctx.lineTo(diagLeft, diagTop);
      }
      
      ctx.closePath();
      break;

      case 'diagonal-corners-alt':
      // Rectangle with the other two diagonally opposite corners rounded
      const diagAltWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const diagAltHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      
      const diagAltLeft = centerX - diagAltWidth / 2;
      const diagAltTop = centerY - diagAltHeight / 2;
      const diagAltRight = diagAltLeft + diagAltWidth;
      const diagAltBottom = diagAltTop + diagAltHeight;
      
      // Calculate corner radius
      const diagAltRadius = (window.mask.cornerRadius / 100) * Math.min(diagAltWidth, diagAltHeight) * 0.5;
      const clampedAltRadius = Math.min(diagAltRadius, diagAltWidth / 2, diagAltHeight / 2);
      
      // Draw shape with top-right and bottom-left corners rounded
      ctx.moveTo(diagAltLeft, diagAltTop);
      ctx.lineTo(diagAltRight - clampedAltRadius, diagAltTop); // Top edge
      
      if (clampedAltRadius > 0) {
        // Top-right rounded corner
        ctx.quadraticCurveTo(diagAltRight, diagAltTop, diagAltRight, diagAltTop + clampedAltRadius);
      } else {
        ctx.lineTo(diagAltRight, diagAltTop);
      }
      
      ctx.lineTo(diagAltRight, diagAltBottom); // Right edge - straight to bottom-right (sharp corner)
      ctx.lineTo(diagAltLeft + clampedAltRadius, diagAltBottom); // Bottom edge
      
      if (clampedAltRadius > 0) {
        // Bottom-left rounded corner
        ctx.quadraticCurveTo(diagAltLeft, diagAltBottom, diagAltLeft, diagAltBottom - clampedAltRadius);
      } else {
        ctx.lineTo(diagAltLeft, diagAltBottom);
      }
      
      ctx.lineTo(diagAltLeft, diagAltTop); // Left edge - straight to top-left (sharp corner)
      ctx.closePath();
      break;

      case 'wave1':
      // A wave-like shape with S-curves on top and bottom edges
      const adjuster = (maskSizePercent * 0.89)
      const waveWidth = (imageWidth * adjuster) - (borderOffset * 2);
      const waveHeight = (imageHeight * adjuster) - (borderOffset * 2);
      
      const waveLeft = centerX - waveWidth / 2;
      const waveTop = centerY - waveHeight / 2;
      const waveRight = waveLeft + waveWidth;
      const waveBottom = waveTop + waveHeight;
      
      // Use cornerRadius slider to control the depth/rise of the wave
      // The wave depth is a percentage (max 20%) of the SHORTER dimension of the shape
      const smallerDimension = Math.min(waveWidth, waveHeight);
      const maxWaveDepth = smallerDimension * 0.2; // 20% of the smaller dimension
      const waveDepth = (window.mask.cornerRadius / 100) * maxWaveDepth;

      ctx.moveTo(waveLeft, waveTop);
      
      // Top wave edge using a Bezier curve for a smooth S-shape
      ctx.bezierCurveTo(
        waveLeft + waveWidth * 0.25, waveTop - waveDepth,     // Control point 1 (crest)
        waveLeft + waveWidth * 0.75, waveTop + waveDepth,     // Control point 2 (trough)
        waveRight, waveTop                                     // End point
      );

      // Right straight edge
      ctx.lineTo(waveRight, waveBottom);
      
      // Bottom wave edge (inverted S-curve)
      ctx.bezierCurveTo(
        waveRight - waveWidth * 0.25, waveBottom + waveDepth, // Control point 1 (trough)
        waveRight - waveWidth * 0.75, waveBottom - waveDepth, // Control point 2 (crest)
        waveLeft, waveBottom                                   // End point
      );

      // Left straight edge, closing the path
      ctx.lineTo(waveLeft, waveTop);

      ctx.closePath();
      break;

      case 'wave2':
      // A wave-like shape with S-curves on top and bottom edges (horizontally flipped)
      const adjuster2 = (maskSizePercent * 0.89)
      const wave2Width = (imageWidth * adjuster2) - (borderOffset * 2);
      const wave2Height = (imageHeight * adjuster2) - (borderOffset * 2);
      
      const wave2Left = centerX - wave2Width / 2;
      const wave2Top = centerY - wave2Height / 2;
      const wave2Right = wave2Left + wave2Width;
      const wave2Bottom = wave2Top + wave2Height;
      
      // Use cornerRadius slider to control the depth/rise of the wave
      // The wave depth is a percentage (max 20%) of the SHORTER dimension of the shape
      const smallerDimension2 = Math.min(wave2Width, wave2Height);
      const maxWave2Depth = smallerDimension2 * 0.2; // 20% of the smaller dimension
      const wave2Depth = (window.mask.cornerRadius / 100) * maxWave2Depth;

      ctx.moveTo(wave2Left, wave2Top);
      
      // Top wave edge using a Bezier curve for a smooth S-shape (horizontally flipped)
      ctx.bezierCurveTo(
        wave2Left + wave2Width * 0.25, wave2Top + wave2Depth,     // Control point 1 (trough - flipped)
        wave2Left + wave2Width * 0.75, wave2Top - wave2Depth,     // Control point 2 (crest - flipped)
        wave2Right, wave2Top                                       // End point
      );

      // Right straight edge
      ctx.lineTo(wave2Right, wave2Bottom);
      
      // Bottom wave edge (inverted S-curve, horizontally flipped)
      ctx.bezierCurveTo(
        wave2Right - wave2Width * 0.25, wave2Bottom - wave2Depth, // Control point 1 (crest - flipped)
        wave2Right - wave2Width * 0.75, wave2Bottom + wave2Depth, // Control point 2 (trough - flipped)
        wave2Left, wave2Bottom                                     // End point
      );

      // Left straight edge, closing the path
      ctx.lineTo(wave2Left, wave2Top);

      ctx.closePath();
      break;

      case 'wave3':
      // A wave-like shape with S-curves on left and right edges
      const adjuster3 = (maskSizePercent * 0.89)
      const wave3Width = (imageWidth * adjuster3) - (borderOffset * 2);
      const wave3Height = (imageHeight * adjuster3) - (borderOffset * 2);
      
      const wave3Left = centerX - wave3Width / 2;
      const wave3Top = centerY - wave3Height / 2;
      const wave3Right = wave3Left + wave3Width;
      const wave3Bottom = wave3Top + wave3Height;
      
      // Use cornerRadius slider to control the depth/rise of the wave
      // The wave depth is a percentage (max 20%) of the SHORTER dimension of the shape
      const smallerDimension3 = Math.min(wave3Width, wave3Height);
      const maxWave3Depth = smallerDimension3 * 0.2; // 20% of the smaller dimension
      const wave3Depth = (window.mask.cornerRadius / 100) * maxWave3Depth;

      ctx.moveTo(wave3Left, wave3Top);
      
      // Top flat edge
      ctx.lineTo(wave3Right, wave3Top);
      
      // Right wave edge using a Bezier curve for a smooth S-shape
      ctx.bezierCurveTo(
        wave3Right + wave3Depth, wave3Top + wave3Height * 0.25,     // Control point 1 (outward curve)
        wave3Right - wave3Depth, wave3Top + wave3Height * 0.75,     // Control point 2 (inward curve)
        wave3Right, wave3Bottom                                      // End point
      );

      // Bottom flat edge
      ctx.lineTo(wave3Left, wave3Bottom);
      
      // Left wave edge (inverted S-curve)
      ctx.bezierCurveTo(
        wave3Left - wave3Depth, wave3Bottom - wave3Height * 0.25,   // Control point 1 (outward curve)
        wave3Left + wave3Depth, wave3Bottom - wave3Height * 0.75,   // Control point 2 (inward curve)
        wave3Left, wave3Top                                          // End point
      );

      ctx.closePath();
      break;

      case 'wave4':
      // A wave-like shape with S-curves on left and right edges (horizontally flipped from wave3)
      const adjuster4 = (maskSizePercent * 0.89)
      const wave4Width = (imageWidth * adjuster4) - (borderOffset * 2);
      const wave4Height = (imageHeight * adjuster4) - (borderOffset * 2);
      
      const wave4Left = centerX - wave4Width / 2;
      const wave4Top = centerY - wave4Height / 2;
      const wave4Right = wave4Left + wave4Width;
      const wave4Bottom = wave4Top + wave4Height;
      
      // Use cornerRadius slider to control the depth/rise of the wave
      // The wave depth is a percentage (max 20%) of the SHORTER dimension of the shape
      const smallerDimension4 = Math.min(wave4Width, wave4Height);
      const maxWave4Depth = smallerDimension4 * 0.2; // 20% of the smaller dimension
      const wave4Depth = (window.mask.cornerRadius / 100) * maxWave4Depth;

      ctx.moveTo(wave4Left, wave4Top);
      
      // Top flat edge
      ctx.lineTo(wave4Right, wave4Top);
      
      // Right wave edge using a Bezier curve for a smooth S-shape (horizontally flipped)
      ctx.bezierCurveTo(
        wave4Right - wave4Depth, wave4Top + wave4Height * 0.25,     // Control point 1 (inward curve - flipped)
        wave4Right + wave4Depth, wave4Top + wave4Height * 0.75,     // Control point 2 (outward curve - flipped)
        wave4Right, wave4Bottom                                      // End point
      );

      // Bottom flat edge
      ctx.lineTo(wave4Left, wave4Bottom);
      
      // Left wave edge (inverted S-curve, horizontally flipped)
      ctx.bezierCurveTo(
        wave4Left + wave4Depth, wave4Bottom - wave4Height * 0.25,   // Control point 1 (inward curve - flipped)
        wave4Left - wave4Depth, wave4Bottom - wave4Height * 0.75,   // Control point 2 (outward curve - flipped)
        wave4Left, wave4Top                                          // End point
      );

      ctx.closePath();
      break;

      case 'ellipse':
      // Calculate ellipse dimensions
      const maxRadiusX = imageWidth / 2;
      const maxRadiusY = imageHeight / 2;
      
      let radiusX, radiusY;
      
      if (window.mask.ratio >= 1) {
        // Width is larger than or equal to height
        radiusX = (maxRadiusX * maskSizePercent) - borderOffset;
        radiusY = ((maxRadiusY * maskSizePercent) / window.mask.ratio) - borderOffset;
      } else {
        // Height is larger than width
        radiusX = ((maxRadiusX * maskSizePercent) * window.mask.ratio) - borderOffset;
        radiusY = (maxRadiusY * maskSizePercent) - borderOffset;
      }
      
      ctx.ellipse(centerX, centerY, Math.max(0, radiusX), Math.max(0, radiusY), 0, 0, 2 * Math.PI);
      break;

      case 'star':
      // Calculate star radius to maximize its bounding box within the image space
      const starMaskWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const starMaskHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      
      // Bounding box of an upright 5-point star:
      const starRadiusFromWidth = starMaskWidth / (2 * Math.cos(18 * Math.PI / 180));
      const starRadiusFromHeight = starMaskHeight / (1 + Math.sin(54 * Math.PI / 180));
      const outerRadius = Math.min(starRadiusFromWidth, starRadiusFromHeight);
      const innerRadius = outerRadius * 0.4;
      const spikes = 5;

      // Calculate vertical offset to center the star's bounding box
      const yOffset = (outerRadius / 2) * (1 - Math.sin(54 * Math.PI / 180));
      const adjustedCenterY = centerY + yOffset;
      
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = centerX + Math.cos(angle - Math.PI / 2) * radius;
        const y = adjustedCenterY + Math.sin(angle - Math.PI / 2) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      break;

      case 'hexagon':
      // Calculate hexagon radius to maximize its bounding box within the image space
      const hexMaskWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const hexMaskHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      
      // A regular hexagon's bounding box width is 2*r and height is sqrt(3)*r
      const hexRadiusFromWidth = hexMaskWidth / 2;
      const hexRadiusFromHeight = hexMaskHeight / Math.sqrt(3);
      const hexRadius = Math.min(hexRadiusFromWidth, hexRadiusFromHeight);
      
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        hexPoints.push({
          x: Math.cos(angle) * hexRadius,
          y: Math.sin(angle) * hexRadius
        });
      }
      
      const hexCornerRadius = (window.mask.cornerRadius / 100) * hexRadius * 0.3;
      drawRoundedPolygon(ctx, hexPoints, centerX, centerY, hexCornerRadius);
      break;

      case 'heart':
    const heartMaskWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
    const heartMaskHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);

    // This factor controls the size. A value of 1.1 fits the heart perfectly.
    // Smaller values (like 0.8) make it larger but risk clipping.
    const overshoot = 0.79;
    const size = Math.min(heartMaskWidth / overshoot, heartMaskHeight / overshoot);

    const w = size;
    const h = size;
    
    // Center the heart horizontally.
    const x = centerX - w / 2;
    
    // MODIFIED: This calculation now correctly shifts the heart UPWARD.
    // It takes the center position and subtracts an additional amount to move it up.
    // You can adjust the `0.15` factor to fine-tune the vertical position.
    const y = centerY - (h / 2) - (h * 0.11);

    // The drawing commands remain the same.
    ctx.moveTo(x + w / 2, y + h * 0.35); // Cusp
    ctx.bezierCurveTo(
        x - w * 0.1, y - h * 0.1,  // CP1
        x, y + h * 0.7,            // CP2
        x + w / 2, y + h            // Bottom
    );
    ctx.bezierCurveTo(
        x + w, y + h * 0.7,         // CP1
        x + w * 1.1, y - h * 0.1,   // CP2
        x + w / 2, y + h * 0.35      // Cusp
    );
    break;

      case 'vintage':
      // Vintage decorative frame with notched corners
      const vintageWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const vintageHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      const vw = vintageWidth * 0.5;
      const vh = vintageHeight * 0.5;
      const notchSize = Math.min(vw, vh) * 0.15;
      
      const vLeft = centerX - vw;
      const vRight = centerX + vw;
      const vTop = centerY - vh;
      const vBottom = centerY + vh;
      
      // Start from top-left notch
      ctx.moveTo(vLeft + notchSize, vTop);
      ctx.lineTo(vRight - notchSize, vTop);
      ctx.lineTo(vRight, vTop + notchSize);
      ctx.lineTo(vRight, vBottom - notchSize);
      ctx.lineTo(vRight - notchSize, vBottom);
      ctx.lineTo(vLeft + notchSize, vBottom);
      ctx.lineTo(vLeft, vBottom - notchSize);
      ctx.lineTo(vLeft, vTop + notchSize);
      ctx.closePath();
      break;

      case 'ornate':
      // Ornate frame with curved indentations
      const ornateWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const ornateHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      const ow = ornateWidth * 0.48;
      const oh = ornateHeight * 0.48;
      const curveDepth = Math.min(ow, oh) * 0.2;
      
      const oLeft = centerX - ow;
      const oRight = centerX + ow;
      const oTop = centerY - oh;
      const oBottom = centerY + oh;
      
      ctx.moveTo(centerX, oTop);
      ctx.quadraticCurveTo(oRight - curveDepth, oTop - curveDepth, oRight, centerY);
      ctx.quadraticCurveTo(oRight + curveDepth, oBottom - curveDepth, centerX, oBottom);
      ctx.quadraticCurveTo(oLeft + curveDepth, oBottom + curveDepth, oLeft, centerY);
      ctx.quadraticCurveTo(oLeft - curveDepth, oTop + curveDepth, centerX, oTop);
      break;
      
      case 'puzzle':
      // Puzzle piece shape
      const puzzleWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const puzzleHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      const pw = puzzleWidth * 0.42;
      const ph = puzzleHeight * 0.42;
      const knobSize = Math.min(pw, ph) * 0.15;
      
      const pLeft = centerX - pw;
      const pRight = centerX + pw;
      const pTop = centerY - ph;
      const pBottom = centerY + ph;
      
      ctx.moveTo(pLeft, pTop);
      ctx.lineTo(centerX - knobSize, pTop);
      ctx.arc(centerX, pTop, knobSize, Math.PI, 0, false);
      ctx.lineTo(pRight, pTop);
      ctx.lineTo(pRight, centerY - knobSize);
      ctx.arc(pRight, centerY, knobSize, -Math.PI/2, Math.PI/2, false);
      ctx.lineTo(pRight, pBottom);
      ctx.lineTo(centerX + knobSize, pBottom);
      ctx.arc(centerX, pBottom, knobSize, 0, Math.PI, false);
      ctx.lineTo(pLeft, pBottom);
      ctx.lineTo(pLeft, centerY + knobSize);
      ctx.arc(pLeft, centerY, knobSize, Math.PI/2, -Math.PI/2, false);
      ctx.closePath();
      break;

      case 'postage':
      // Postage stamp style with perforated edges
      const postageWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const postageHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      const postW = postageWidth * 0.5;
      const postH = postageHeight * 0.5;
      const postPerfSize = Math.min(postW, postH) * 0.04;
      const postPerfs = 10;
      
      const postLeft = centerX - postW;
      const postRight = centerX + postW;
      const postTop = centerY - postH;
      const postBottom = centerY + postH;
      
      // Create perforated rectangle
      ctx.moveTo(postLeft, postTop);
      
      // Top edge
      for (let i = 0; i <= postPerfs; i++) {
        const x = postLeft + (i * (postW * 2) / postPerfs);
        if (i % 2 === 0) {
          ctx.lineTo(x, postTop - postPerfSize);
          ctx.arc(x, postTop, postPerfSize, -Math.PI/2, Math.PI/2, false);
        } else {
          ctx.lineTo(x, postTop + postPerfSize);
          ctx.arc(x, postTop, postPerfSize, Math.PI/2, -Math.PI/2, false);
        }
      }
      
      // Right edge
      for (let i = 0; i <= postPerfs; i++) {
        const y = postTop + (i * (postH * 2) / postPerfs);
        if (i % 2 === 0) {
          ctx.lineTo(postRight + postPerfSize, y);
          ctx.arc(postRight, y, postPerfSize, 0, Math.PI, false);
        } else {
          ctx.lineTo(postRight - postPerfSize, y);
          ctx.arc(postRight, y, postPerfSize, Math.PI, 0, false);
        }
      }
      
      // Bottom edge
      for (let i = postPerfs; i >= 0; i--) {
        const x = postLeft + (i * (postW * 2) / postPerfs);
        if (i % 2 === 0) {
          ctx.lineTo(x, postBottom + postPerfSize);
          ctx.arc(x, postBottom, postPerfSize, Math.PI/2, -Math.PI/2, false);
        } else {
          ctx.lineTo(x, postBottom - postPerfSize);
          ctx.arc(x, postBottom, postPerfSize, -Math.PI/2, Math.PI/2, false);
        }
      }
      
      // Left edge
      for (let i = postPerfs; i >= 0; i--) {
        const y = postTop + (i * (postH * 2) / postPerfs);
        if (i % 2 === 0) {
          ctx.lineTo(postLeft - postPerfSize, y);
          ctx.arc(postLeft, y, postPerfSize, Math.PI, 0, false);
        } else {
          ctx.lineTo(postLeft + postPerfSize, y);
          ctx.arc(postLeft, y, postPerfSize, 0, Math.PI, false);
        }
      }
      
      ctx.closePath();
      break;

      case 'ticket':
      // Ticket stub with torn/perforated edge
      const ticketWidth = (imageWidth * maskSizePercent) - (borderOffset * 2);
      const ticketHeight = (imageHeight * maskSizePercent) - (borderOffset * 2);
      const ttw = ticketWidth * 0.5;
      const tth = ticketHeight * 0.35;
      const tearSize = tth * 0.08;
      const tears = 8;
      
      const tLeft = centerX - ttw;
      const tRight = centerX + ttw;
      const tTop = centerY - tth;
      const tBottom = centerY + tth;
      
      ctx.moveTo(tLeft, tTop);
      ctx.lineTo(tRight, tTop);
      ctx.lineTo(tRight, tBottom);
      
      // Torn bottom edge
      for (let i = 0; i < tears; i++) {
        const x = tRight - (i * (ttw * 2) / tears);
        const y = tBottom + (Math.random() - 0.5) * tearSize;
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(tLeft, tTop);
      ctx.closePath();
      break;
  }
  
}

// Function to draw mask border
function drawMaskBorder(ctx, offsetX, offsetY, imageWidth, imageHeight) {
  // Check if border should be drawn (thickness > 0)
  if (window.mask.borderThickness <= 0) {
    return;
  }

  // Save current context state
  ctx.save();

  // Set border properties
  ctx.strokeStyle = window.mask.borderColor;
  ctx.lineWidth = window.mask.borderThickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Handle double border style
  if (window.mask.borderStyle === 'double') {
    // Draw outer border
    setBorderStyle(ctx, 'solid', window.mask.borderThickness);
    createMaskPath(ctx, offsetX, offsetY, imageWidth, imageHeight, false, window.mask.borderMargin);
    ctx.stroke();

    // Draw inner border
    const innerOffset = window.mask.borderMargin + window.mask.borderThickness * 2;
    createMaskPath(ctx, offsetX, offsetY, imageWidth, imageHeight, false, innerOffset);
    ctx.stroke();
  } else {
    // Set dash pattern for other styles
    setBorderStyle(ctx, window.mask.borderStyle, window.mask.borderThickness);
    
    // Create border path with margin offset
    createMaskPath(ctx, offsetX, offsetY, imageWidth, imageHeight, false, window.mask.borderMargin);
    ctx.stroke();
  }

  // Restore context state
  ctx.restore();
}

// Apply mask to the image drawing context
function applyMask(ctx, offsetX, offsetY, imageWidth, imageHeight, shadowMode = false) {

  createMaskPath(ctx, offsetX, offsetY, imageWidth, imageHeight, shadowMode);
  
  if (!shadowMode) {
    ctx.clip();
  }
}

// Apply shadow mask (creates path without clipping)
function applyShadowMask(ctx, offsetX, offsetY, imageWidth, imageHeight) {

  // Create the mask path for shadow
  createMaskPath(ctx, offsetX, offsetY, imageWidth, imageHeight, true);
  return true; // Return true to indicate mask shadow path was created
}

// Function to get current mask settings
function getMaskSettings() {
  return {
    type: window.mask.type,
    size: window.mask.size,
    ratio: window.mask.ratio,
    positionX: window.mask.positionX,
    positionY: window.mask.positionY,
    cornerRadius: window.mask.cornerRadius,
    borderStyle: window.mask.borderStyle,
    borderThickness: window.mask.borderThickness,
    borderColor: window.mask.borderColor,
    borderMargin: window.mask.borderMargin
  };
}

// Function to set mask settings (useful for presets or loading saved settings)
function setMaskSettings(settings) {
  if (settings.type !== undefined) {
    window.mask.type = settings.type;
    document.getElementById('maskType').value = settings.type;
  }
  if (settings.size !== undefined) {
    window.mask.size = settings.size;
    document.getElementById('maskSize').value = settings.size;
  }
  if (settings.ratio !== undefined) {
    window.mask.ratio = settings.ratio;
    document.getElementById('maskRatio').value = settings.ratio;
  }
  if (settings.positionX !== undefined) {
    window.mask.positionX = settings.positionX;
    document.getElementById('maskPositionX').value = settings.positionX;
  }
  if (settings.positionY !== undefined) {
    window.mask.positionY = settings.positionY;
    document.getElementById('maskPositionY').value = settings.positionY;
  }
  if (settings.cornerRadius !== undefined) {
    window.mask.cornerRadius = settings.cornerRadius;
    const cornerRadiusElement = document.getElementById('maskCornerRadius');
    if (cornerRadiusElement) {
      cornerRadiusElement.value = settings.cornerRadius;
    }
  }
  
  // Set border settings
  if (settings.borderStyle !== undefined) {
    window.mask.borderStyle = settings.borderStyle;
    const borderStyleElement = document.getElementById('maskBorderStyle');
    if (borderStyleElement) {
      borderStyleElement.value = settings.borderStyle;
    }
  }
  if (settings.borderThickness !== undefined) {
    window.mask.borderThickness = settings.borderThickness;
    const borderThicknessElement = document.getElementById('maskBorderThickness');
    if (borderThicknessElement) {
      borderThicknessElement.value = settings.borderThickness;
    }
  }
  if (settings.borderColor !== undefined) {
    window.mask.borderColor = settings.borderColor;
    const borderColorElement = document.getElementById('maskBorderColor');
    if (borderColorElement) {
      borderColorElement.value = settings.borderColor;
    }
  }
  if (settings.borderMargin !== undefined) {
    window.mask.borderMargin = settings.borderMargin;
    const borderMarginElement = document.getElementById('maskBorderMargin');
    if (borderMarginElement) {
      borderMarginElement.value = settings.borderMargin;
    }
  }

  // Handle legacy borderEnabled setting for backward compatibility
  if (settings.borderEnabled !== undefined && settings.borderEnabled === false) {
    // If borderEnabled was false, set thickness to 0
    window.mask.borderThickness = 0;
    const borderThicknessElement = document.getElementById('maskBorderThickness');
    if (borderThicknessElement) {
      borderThicknessElement.value = 0;
    }
  }

  // Trigger UI updates
  const maskType = document.getElementById('maskType');
  maskType.dispatchEvent(new Event('change'));
  
  drawImageWithEffects();
}

// Initialize mask controls when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initMaskControls();
});

// Export functions for use in other files
window.maskFunctions = {
  applyMask,
  applyShadowMask,
  createMaskPath,
  drawMaskBorder,
  getMaskSettings,
  setMaskSettings,
  initMaskControls
};
