// Auth check for protected pages
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // If no token or user data, redirect to login
    if (!token || !user) {
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

// Add this to protected pages (dashboard, journal, history, quiz)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}

export { checkAuth };