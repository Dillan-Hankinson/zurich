// Dark mode functionality
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const darkModeText = document.getElementById('darkModeText');
    
    // Check for saved dark mode preference or default to light mode
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply saved preference on page load
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateToggleButton(true);
    }
    
    // Toggle dark mode
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDark);
            updateToggleButton(isDark);
        });
    }
    
    function updateToggleButton(isDark) {
        if (isDark) {
            darkModeIcon.textContent = '☀️';
            darkModeText.textContent = 'Light Mode';
        } else {
            darkModeIcon.textContent = '🌙';
            darkModeText.textContent = 'Dark Mode';
        }
    }
});
