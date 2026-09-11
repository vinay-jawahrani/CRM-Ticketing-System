const API_BASE = window.APP_CONFIG?.API_BASE || 'http://localhost:8000/api';

function saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function getToken() {
    return localStorage.getItem('token');
}

function getCurrentUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
    }
}

function setupLoginForm() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed');
            saveSession(data.access_token, data.user);
            window.location.href = 'index.html';
        } catch (err) {
            alert(err.message);
        }
    });
}

function setupRegisterForm() {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            full_name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value,
        };
        
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Registration failed');
            saveSession(data.access_token, data.user);
            window.location.href = 'index.html';
        } catch (err) {
            alert(err.message);
        }
    });
}