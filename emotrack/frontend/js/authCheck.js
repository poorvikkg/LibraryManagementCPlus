import { authService } from './authService.js';

// Redirect to login if not authenticated
function checkAuth() {
    if (!authService.isAuthenticated()) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Update UI with user info
function updateUserInfo() {
    const user = authService.getUser();
    if (user) {
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
            welcomeText.textContent = `Hello, ${user.name}`;
        }
    }
}

// Handle logout
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authService.logout();
        });
    }
}

// Initialize auth features
export function initAuth() {
    if (checkAuth()) {
        updateUserInfo();
        setupLogout();
    }
}

export { checkAuth, updateUserInfo, setupLogout };