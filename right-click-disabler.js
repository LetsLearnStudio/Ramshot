// Disable right-click context menu
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  return false;
}, false);

// Prevent F12 key (developer tools)
document.addEventListener('keydown', function(e) {
  // Check for F12 key
  if (e.key === 'F12' || e.keyCode === 123) {
    e.preventDefault();
    return false;
  }
  
  // Also prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (common dev tools shortcuts)
  if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
    e.preventDefault();
    return false;
  }
  
  // Prevent Ctrl+U (view source)
  if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
    e.preventDefault();
    return false;
  }
}, false);

// Optional: Display a custom message when users try to right-click
document.addEventListener('mousedown', function(e) {
  if(e.button === 2) { // Right mouse button
    // Uncomment the line below if you want to show a message
    // alert('Right-clicking is disabled');
    return false;
  }
}, false);