var API_URL = 'http://localhost:8000';
var refreshTokenPromise = null;

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

function isTokenExpired(token) {
    if (!token) return true;

    try {
        var parts = token.split('.');
        if (parts.length !== 3) return true;

        var payload = JSON.parse(atob(parts[1]));
        var exp = payload.exp * 1000;
        var now = Date.now();

        var buffer = 10 * 1000;
        var isExpired = now >= (exp - buffer);

        if (isExpired) {
            console.log('Token is expired or expiring soon (within 10s)');
            console.log('Token exp:', new Date(exp).toISOString());
            console.log('Now:', new Date(now).toISOString());
        }

        return isExpired;
    } catch (e) {
        console.error('Error checking token expiration:', e);
        return true;
    }
}

function shouldRefreshToken(token) {
    if (!token) return false;

    try {
        var parts = token.split('.');
        if (parts.length !== 3) return false;

        var payload = JSON.parse(atob(parts[1]));
        var exp = payload.exp * 1000;
        var now = Date.now();

        var timeUntilExpiry = exp - now;
        var oneMinute = 60 * 1000;

        var shouldRefresh = timeUntilExpiry < oneMinute && timeUntilExpiry > 0;

        if (shouldRefresh) {
            console.log('Token should be refreshed proactively');
            console.log('Time until expiry:', Math.floor(timeUntilExpiry / 1000), 'seconds');
        }

        return shouldRefresh;
    } catch (e) {
        console.error('Error checking token refresh:', e);
        return false;
    }
}

function refreshAccessToken() {
    if (refreshTokenPromise) {
        console.log('Token refresh already in progress, reusing promise');
        return refreshTokenPromise;
    }

    var refreshToken = getRefreshToken();
    if (!refreshToken) {
        console.error('No refresh token available');
        return Promise.reject(new Error('No refresh token'));
    }

    if (isTokenExpired(refreshToken)) {
        console.error('Refresh token is expired');
        clearTokens();
        return Promise.reject(new Error('Refresh token expired'));
    }

    console.log('Refreshing access token...');
    refreshTokenPromise = fetch(API_URL + '/auth/token/refresh/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            refresh: refreshToken
        })
    })
    .then(function(response) {
        if (!response.ok) {
            console.error('Token refresh failed with status:', response.status);
            if (response.status === 401) {
                console.error('Refresh token is invalid, clearing all tokens');
                clearTokens();
            } else {
                console.error('Network or server error, keeping refresh token');
                localStorage.removeItem('access_token');
            }
            refreshTokenPromise = null;
            throw new Error('Failed to refresh token');
        }
        return response.json();
    })
    .then(function(data) {
        console.log('Token refreshed successfully');
        if (!data.access) {
            console.error('No access token in response');
            refreshTokenPromise = null;
            throw new Error('Invalid token response');
        }
        localStorage.setItem('access_token', data.access);
        console.log('New access token saved');
        refreshTokenPromise = null;
        return data.access;
    })
    .catch(function(error) {
        console.error('Error during token refresh:', error);
        refreshTokenPromise = null;
        throw error;
    });

    return refreshTokenPromise;
}

function fetchWithAuth(url, options) {
    options = options || {};
    options.headers = options.headers || {};

    var token = getAccessToken();

    if (isTokenExpired(token) || shouldRefreshToken(token)) {
        console.log('Token expired or expiring soon, refreshing before request...');
        return refreshAccessToken()
            .then(function(newToken) {
                options.headers['Authorization'] = 'Bearer ' + newToken;
                return fetch(url, options);
            })
            .catch(function(error) {
                console.error('Token refresh failed:', error);
                var stillHasRefresh = getRefreshToken();
                console.log('Still has refresh token after error:', !!stillHasRefresh);
                if (!stillHasRefresh) {
                    console.log('No refresh token, redirecting to home');
                    window.location.href = 'index.html';
                } else {
                    console.log('Refresh token still exists, not redirecting');
                }
                throw error;
            });
    }

    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }

    return fetch(url, options)
        .then(function(response) {
            if (response.status === 401) {
                console.log('Got 401, attempting token refresh...');
                return refreshAccessToken()
                    .then(function(newToken) {
                        options.headers['Authorization'] = 'Bearer ' + newToken;
                        return fetch(url, options);
                    })
                    .catch(function(error) {
                        console.error('Token refresh failed after 401:', error);
                        var stillHasRefresh = getRefreshToken();
                        console.log('Still has refresh token after 401 error:', !!stillHasRefresh);
                        if (!stillHasRefresh) {
                            console.log('No refresh token left, redirecting to home');
                            window.location.href = 'index.html';
                        } else {
                            console.log('Refresh token still exists, not redirecting');
                        }
                        throw error;
                    });
            }
            return response;
        });
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
        if (data.access && data.refresh) {
            setTokens(data.access, data.refresh);
            closeAuthModal();
            window.location.reload();
        } else {
            alert('Registration successful! Please login.');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('modalTitle').textContent = 'Login';
            document.getElementById('registerFormElement').reset();
        }
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
        fetchWithAuth(API_URL + '/auth/user/')
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
            console.error('updateNavigation error:', error);
            if (userInfo) {
                userInfo.style.display = 'none';
            }
            if (authButtons) {
                authButtons.style.display = 'flex';
            }
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

function checkAndRefreshToken() {
    var token = getAccessToken();
    var refreshToken = getRefreshToken();

    if (!token || !refreshToken) {
        console.log('No tokens found');
        return Promise.resolve();
    }

    if (isTokenExpired(refreshToken)) {
        console.log('Refresh token expired, clearing tokens');
        clearTokens();
        return Promise.resolve();
    }

    if (isTokenExpired(token)) {
        console.log('Access token expired, refreshing...');
        return refreshAccessToken()
            .catch(function(error) {
                console.error('Failed to refresh token on page load:', error);
            });
    }

    if (shouldRefreshToken(token)) {
        console.log('Access token expiring soon, refreshing proactively...');
        return refreshAccessToken()
            .catch(function(error) {
                console.warn('Proactive token refresh failed:', error);
            });
    }

    return Promise.resolve();
}

function initAuth() {
    checkAndRefreshToken()
        .then(function() {
            updateNavigation();
        });

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
