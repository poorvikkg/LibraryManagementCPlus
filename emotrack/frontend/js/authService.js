const API_URL = 'http://localhost:5000/api';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    async login(email, password) {
        try {
            console.log('Attempting login...', { email });
            
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            // Check if response exists
            if (!response) {
                throw new Error('No response from server. Check if backend is running.');
            }

            // Try to parse response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned invalid response format');
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            this.setUserData(data);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            if (error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Please check if backend is running.');
            }
            throw error;
        }
    }

    async register(name, email, password) {
        try {
            console.log('Attempting registration...', { name, email });
            
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ name, email, password }),
                credentials: 'include'
            });
            
            // Check if response exists
            if (!response) {
                throw new Error('No response from server. Check if backend is running.');
            }

            // Try to parse response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned invalid response format');
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            this.setUserData(data);
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    setUserData(data) {
        this.token = data.token;
        this.user = {
            id: data._id,
            name: data.name,
            email: data.email
        };
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }
}

export const authService = new AuthService();