let globalToastContainer = document.getElementById('toastContainer');
if (!globalToastContainer) {
    globalToastContainer = document.createElement('div');
    globalToastContainer.id = 'toastContainer';
    globalToastContainer.className = 'toast-container';
    document.body.appendChild(globalToastContainer);
}

function showToast(message, type="success") {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${type === 'error' ? 'ri-error-warning-fill' : 'ri-checkbox-circle-fill'}"></i> ${message}`;
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
    localStorage.removeItem('wishlink_role');
}
function getAuthHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function checkLoginStatus() {
    const token = getToken();
    const role = localStorage.getItem('wishlink_role');
    const loginBtn = document.getElementById('navLoginBtn');
    const registerBtn = document.getElementById('navRegisterBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashBtn = document.getElementById('navDashBtn');
    const adminBtn = document.getElementById('navAdminBtn');

    if (token) {
        if(loginBtn) loginBtn.style.display = 'none';
        if(registerBtn) registerBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'inline-flex';
        if(dashBtn) dashBtn.style.display = 'inline-flex';
        if(adminBtn && role === 'admin') adminBtn.style.display = 'inline-flex';
        
        const heroPrimaryBtn = document.querySelector('.hero .btn-primary');
        if(heroPrimaryBtn) {
            heroPrimaryBtn.textContent = 'Listelerime Git';
            heroPrimaryBtn.onclick = () => window.location.href = 'dashboard.html';
        }
    } else {
        if(loginBtn) loginBtn.style.display = 'inline-flex';
        if(registerBtn) registerBtn.style.display = 'inline-flex';
        if(logoutBtn) logoutBtn.style.display = 'none';
        if(dashBtn) dashBtn.style.display = 'none';
        if(adminBtn) adminBtn.style.display = 'none';
        
        const heroPrimaryBtn = document.querySelector('.hero .btn-primary');
        if(heroPrimaryBtn) {
            heroPrimaryBtn.textContent = 'Hemen Başla';
            heroPrimaryBtn.onclick = () => {
                const modal = document.getElementById('authModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    document.getElementById('registerFormContainer').classList.remove('hidden');
                    document.getElementById('loginFormContainer').classList.add('hidden');
                }
            };
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    const loginBtn = document.getElementById('navLoginBtn');
    const registerBtn = document.getElementById('navRegisterBtn');
    const logoutBtn = document.getElementById('logoutBtn');

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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearToken();
            window.location.href = 'index.html';
        });
    }

    const loginForm = document.getElementById('loginForm');
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
                    localStorage.setItem('wishlink_role', data.role || 'user');
                    authModal.classList.add('hidden');
                    showToast("Giriş yapıldı!");
                    checkLoginStatus();
                    // Optional redirect if we are on login screen
                    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    showToast(data.error || "Giriş başarısız.", "error");
                }
            } catch(e) {
                showToast("Sunucu hatası.", "error");
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
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
                    const loginRes = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: usernameInput, password: passwordInput })
                    });
                    const loginData = await loginRes.json();
                    if(loginRes.ok) {
                         setToken(loginData.token);
                         localStorage.setItem('wishlink_username', loginData.username);
                         localStorage.setItem('wishlink_role', loginData.role || 'user');
                         window.location.href = 'dashboard.html';
                    }
                } else {
                    const data = await res.json();
                    showToast(data.error || "Kayıt başarısız.", "error");
                }
            } catch(e) {
                showToast("Sunucu hatası.", "error");
            }
        });
    }
});
