      document.addEventListener('DOMContentLoaded', function() {
      const blurRectBtn = document.getElementById('blurRectBtn');
      const blurCircleBtn = document.getElementById('blurCircleBtn');
      const shapeSelect = document.getElementById('shape'); // Keep the original select for compatibility
      
      // Set initial state
      let selectedBlurShape = 'rectangle';
      
      function updateBlurShapeButtons(shape) {
        blurRectBtn.classList.toggle('active', shape === 'rectangle');
        blurCircleBtn.classList.toggle('active', shape === 'circle');
        selectedBlurShape = shape;
        
        // Update the original select element for compatibility with existing code
        if (shapeSelect) {
          shapeSelect.value = shape;
        }
      }
      
      // Handle rectangle button click
      blurRectBtn.addEventListener('click', function() {
        updateBlurShapeButtons('rectangle');
      });
      
      // Handle circle button click
      blurCircleBtn.addEventListener('click', function() {
        updateBlurShapeButtons('circle');
      });
      
      // Initialize with rectangle selected
      updateBlurShapeButtons('rectangle');
      
      // Export the selected shape getter for compatibility
      window.getSelectedBlurShape = function() {
        return selectedBlurShape;
      };
    });