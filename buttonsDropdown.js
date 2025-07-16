//Gradient buttons in place of dropdown
    document.addEventListener('DOMContentLoaded', function() {
      const gradientTypeButtons = document.querySelectorAll('.gradient-type-btn');
      const gradientTypeSelect = document.getElementById('gradientType');
      
      gradientTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Remove active class from all buttons
          gradientTypeButtons.forEach(btn => btn.classList.remove('active'));
          
          // Add active class to clicked button
          this.classList.add('active');
          
          // Update the hidden select element
          const gradientType = this.getAttribute('data-type');
          gradientTypeSelect.value = gradientType;
          
          // Trigger the change event on the select element
          gradientTypeSelect.dispatchEvent(new Event('change'));
          
          console.log('Gradient type changed to:', gradientType);
        });
      });
    });
