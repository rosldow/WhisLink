let globalToastContainer = document.getElementById('toastContainer');
if (!globalToastContainer) {
    globalToastContainer = document.createElement('div');
    globalToastContainer.id = 'toastContainer';
    globalToastContainer.className = 'toast-container';
    document.body.appendChild(globalToastContainer);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="ri-checkbox-circle-fill"></i> ${message}`;
    globalToastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToken() {
    return localStorage.getItem('wishlink_token');
}
function setToken(token) {
    localStorage.setItem('wishlink_token', token);
}
function clearToken() {
    localStorage.removeItem('wishlink_token');
    localStorage.removeItem('wishlink_username');
}
function getAuthHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('navLoginBtn');
    const registerBtn = document.getElementById('navRegisterBtn');
    const dashBtn = document.getElementById('navDashBtn');
    const logoutBtn = document.getElementById('navLogoutBtn');
    const ctaBtn = document.getElementById('ctaBtn');

    if (getToken()) {
        if(loginBtn) loginBtn.classList.add('hidden');
        if(registerBtn) registerBtn.classList.add('hidden');
        if(dashBtn) dashBtn.classList.remove('hidden');
        if(logoutBtn) logoutBtn.classList.remove('hidden');
        if(ctaBtn) {
            ctaBtn.innerText = "Panelime Git";
            ctaBtn.addEventListener('click', () => window.location.href = 'dashboard.html');
        }
    } else {
        if(ctaBtn) {
            ctaBtn.addEventListener('click', () => registerBtn.click());
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearToken();
            window.location.href = 'index.html';
        });
    }

    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthModal');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    
    if (loginBtn) loginBtn.addEventListener('click', () => { authModal.classList.remove('hidden'); loginFormContainer.classList.remove('hidden'); registerFormContainer.classList.add('hidden'); });
    if (registerBtn) registerBtn.addEventListener('click', () => { authModal.classList.remove('hidden'); registerFormContainer.classList.remove('hidden'); loginFormContainer.classList.add('hidden'); });
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => authModal.classList.add('hidden'));

    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginFormContainer.classList.add('hidden'); registerFormContainer.classList.remove('hidden'); });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerFormContainer.classList.add('hidden'); loginFormContainer.classList.remove('hidden'); });

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('loginUsername').value;
            const passwordInput = document.getElementById('loginPassword').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usernameInput, password: passwordInput })
                });
                const data = await res.json();
                if (res.ok) {
                    setToken(data.token);
                    localStorage.setItem('wishlink_username', data.username);
                    window.location.href = 'dashboard.html';
                } else {
                    showToast(data.error || "Giriş başarısız.");
                }
            } catch(e) {
                showToast("Sunucu hatası.");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('regUsername').value;
            const passwordInput = document.getElementById('regPassword').value;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usernameInput, password: passwordInput })
                });
                if (res.ok) {
                    showToast("Kayıt başarılı! Giriş yapılıyor...");
                    // auto login functionality just to speed up proto
                    const loginRes = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: usernameInput, password: passwordInput })
                    });
                    const loginData = await loginRes.json();
                    if(loginRes.ok) {
                         setToken(loginData.token);
                         localStorage.setItem('wishlink_username', loginData.username);
                         window.location.href = 'dashboard.html';
                    }
                } else {
                    const data = await res.json();
                    showToast(data.error || "Kayıt başarısız.");
                }
            } catch(e) {
                showToast("Sunucu hatası.");
            }
        });
    }
});
