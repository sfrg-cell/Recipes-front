var API_URL = 'http://localhost:8000';

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

function setTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
}

function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

function isLoggedIn() {
    return getAccessToken() !== null;
}

function showLoginModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('modalTitle').textContent = 'Login';
}

function showRegisterModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Register';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

function handleLogin(event) {
    event.preventDefault();

    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;

    document.getElementById('loginError').textContent = '';

    fetch(API_URL + '/auth/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(function(response) {
        if (!response.ok) {
            return response.json().then(function(err) {
                throw new Error(err.error || 'Login failed');
            });
        }
        return response.json();
    })
    .then(function(data) {
        setTokens(data.access, data.refresh);
        closeAuthModal();
        window.location.reload();
    })
    .catch(function(error) {
        document.getElementById('loginError').textContent = error.message;
    });
}

function handleRegister(event) {
    event.preventDefault();

    var username = document.getElementById('registerUsername').value;
    var email = document.getElementById('registerEmail').value;
    var password = document.getElementById('registerPassword').value;
    var password2 = document.getElementById('registerPassword2').value;

    document.getElementById('registerError').textContent = '';

    if (password !== password2) {
        document.getElementById('registerError').textContent = 'Passwords do not match';
        return;
    }

    fetch(API_URL + '/auth/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            password2: password2
        })
    })
    .then(function(response) {
        if (!response.ok) {
            return response.json().then(function(err) {
                var errorMsg = '';
                if (err.username) {
                    errorMsg = err.username[0];
                } else if (err.email) {
                    errorMsg = err.email[0];
                } else if (err.password) {
                    errorMsg = err.password[0];
                } else {
                    errorMsg = 'Registration failed';
                }
                throw new Error(errorMsg);
            });
        }
        return response.json();
    })
    .then(function(data) {
        alert('Registration successful! Please login.');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('modalTitle').textContent = 'Login';
        document.getElementById('registerFormElement').reset();
    })
    .catch(function(error) {
        document.getElementById('registerError').textContent = error.message;
    });
}

function handleLogout() {
    clearTokens();
    window.location.href = 'index.html';
}

function updateNavigation() {
    var authButtons = document.getElementById('authButtons');
    var userInfo = document.getElementById('userInfo');

    if (!authButtons) return;

    if (isLoggedIn()) {
        fetch(API_URL + '/auth/user/', {
            headers: {
                'Authorization': 'Bearer ' + getAccessToken()
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Not authenticated');
            }
            return response.json();
        })
        .then(function(user) {
            if (userInfo) {
                document.getElementById('usernameDisplay').textContent = user.username;
                userInfo.style.display = 'flex';
                authButtons.style.display = 'none';
            }
        })
        .catch(function(error) {
            clearTokens();
            if (userInfo) {
                userInfo.style.display = 'none';
            }
            authButtons.style.display = 'flex';
        });
    } else {
        if (userInfo) {
            userInfo.style.display = 'none';
        }
        authButtons.style.display = 'flex';
    }
}

function togglePassword(inputId, button) {
    var input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🔓';
    } else {
        input.type = 'password';
        button.textContent = '🔒';
    }
}

function initAuth() {
    updateNavigation();

    var loginBtn = document.getElementById('loginBtn');
    var registerBtn = document.getElementById('registerBtn');
    var logoutBtn = document.getElementById('logoutBtn');

    if (loginBtn) {
        loginBtn.onclick = showLoginModal;
    }

    if (registerBtn) {
        registerBtn.onclick = showRegisterModal;
    }

    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }

    var loginFormElement = document.getElementById('loginFormElement');
    var registerFormElement = document.getElementById('registerFormElement');

    if (loginFormElement) {
        loginFormElement.onsubmit = handleLogin;
    }

    if (registerFormElement) {
        registerFormElement.onsubmit = handleRegister;
    }
}
