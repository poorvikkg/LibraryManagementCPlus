const API_URL = 'http://localhost:5000/api';

// Helper function to handle API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    // Get fresh token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No auth token found');
        window.location.href = '/index.html'; // Redirect to login
        throw new Error('Authentication required. Please log in.');
    }
    
    // Prepare request
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        credentials: 'same-origin'
    };
    
    // Add body if data present
    if (data) {
        options.body = JSON.stringify(data);
    }

    const url = `${API_URL}${endpoint}`;
    // debug
    console.debug('API call', method, url, data, token ? 'token-present' : 'no-token');

    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    let result;
    if (contentType.includes('application/json')) {
        result = await response.json();
    } else {
        // Not JSON — read as text for better debugging
        const text = await response.text();
        // include the text in the thrown error so the caller can inspect HTML errors
        const err = new Error(`Non-JSON response from ${url}: ${text.substring(0,200)}`);
        err.status = response.status;
        err.bodyText = text;
        throw err;
    }

    if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
    }

    return result;
}

// Authentication API calls
export const auth = {
    login: (email, password) => apiCall('/users/login', 'POST', { email, password }),
    register: (name, email, password) => apiCall('/users/register', 'POST', { name, email, password }),
    getProfile: () => apiCall('/users/profile')
};

// Emotions API calls
export const emotions = {
    create: (moodScore, journalEntry) => apiCall('/emotions', 'POST', { moodScore, journalEntry }),
    getHistory: () => apiCall('/emotions'),
    getStats: () => apiCall('/emotions/stats'),
    getLatest: () => apiCall('/emotions/latest')
};

// Journal API calls
export const journal = {

    
    create: (entryText, mood, tags = []) => apiCall('/journal', 'POST', { entryText, mood, tags }),
    getEntries: () => apiCall('/journal'),
    deleteEntry: (entryId) => apiCall(`/journal/${entryId}`, 'DELETE')
};