document.addEventListener('DOMContentLoaded', () => {
    // Select all range sliders within the specified containers AND sliders with border-style class
    const sliders = document.querySelectorAll('.border-slider-container input[type="range"], input[type="range"].border-style');

    // Function to update the background fill of a slider
    function updateSliderFill(slider) {
      const min = slider.min || 0;
      const max = slider.max || 100;
      const value = slider.value;
      const percentage = ((value - min) / (max - min)) * 100;
      
      // Define the gradient
      const fillGradient = `linear-gradient(to right, rgb(4, 0, 255) ${percentage}%, #e0e0e0 ${percentage}%)`;
      
      // Apply the style to the slider
      slider.style.background = fillGradient;
    }

    // Apply the fill on initial load and on input change
    sliders.forEach(slider => {
      // Set initial fill
      updateSliderFill(slider);
      
      // Add event listener for real-time updates
      slider.addEventListener('input', () => {
        updateSliderFill(slider);
      });
    });
  });