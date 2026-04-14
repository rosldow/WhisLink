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

    // Mobile Menu Toggle Logic
    const menuBtn = document.getElementById('menuToggleBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if(navLinks.classList.contains('active')) {
                menuBtn.innerHTML = '<i class="ri-close-line"></i>';
            } else {
                menuBtn.innerHTML = '<i class="ri-menu-line"></i>';
            }
        });

        // Close menu if a link is clicked
        navLinks.addEventListener('click', (e) => {
            if(e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                navLinks.classList.remove('active');
                menuBtn.innerHTML = '<i class="ri-menu-line"></i>';
            }
        });
    }

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

    // --- WISHLINK AI CHATBOT (WISHBOT) INIT ---
    const chatHTML = `
    <div class="wishbot-fab" id="wishbotFab"><i class="ri-robot-2-line"></i></div>
    <div class="wishbot-window" id="wishbotWindow">
        <div class="wishbot-header">
            <h3><i class="ri-bard-fill" style="color:var(--primary)"></i> WishBot Danışmanı</h3>
            <i class="ri-close-line" id="closeWishbot" style="cursor:pointer; font-size:1.5rem;"></i>
        </div>
        <div class="wishbot-messages" id="wishbotMessages">
            <div class="chat-msg bot">Merhaba! Ben WishBot 👋 Aklında birisine hediye almak mı var yoksa listeni mi oluşturacaksın? Nasıl yardımcı olabilirim?</div>
        </div>
        <form class="wishbot-input-area" id="wishbotForm">
            <input type="text" id="wishbotInput" placeholder="Mesajınızı yazın..." autocomplete="off">
            <button type="submit" id="wishbotSendBtn"><i class="ri-send-plane-fill"></i></button>
        </form>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const wishbotFab = document.getElementById('wishbotFab');
    const wishbotWindow = document.getElementById('wishbotWindow');
    const closeWishbot = document.getElementById('closeWishbot');
    const wishbotForm = document.getElementById('wishbotForm');
    const wishbotInput = document.getElementById('wishbotInput');
    const wishbotMessages = document.getElementById('wishbotMessages');

    let chatHistory = [];

    wishbotFab.addEventListener('click', () => {
        wishbotWindow.classList.add('active');
        wishbotInput.focus();
    });

    closeWishbot.addEventListener('click', () => {
        wishbotWindow.classList.remove('active');
    });

    wishbotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = wishbotInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        wishbotInput.value = '';
        
        chatHistory.push({ role: 'user', parts: [{ text }] });

        const typingId = 'typing-' + Date.now();
        wishbotMessages.insertAdjacentHTML('beforeend', `<div class="chat-msg bot typing-indicator" id="${typingId}"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`);
        wishbotMessages.scrollTop = wishbotMessages.scrollHeight;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory.slice(0, -1) }) 
            });
            
            document.getElementById(typingId)?.remove();

            if (res.ok) {
                const data = await res.json();
                appendMessage('bot', data.text);
                chatHistory.push({ role: 'model', parts: [{ text: data.text }] });
            } else {
                appendMessage('bot', 'Üzgünüm, şu an bağlantı kuramıyorum. Lütfen sunucu loglarını ve API anahtarınızı kontrol edin.');
            }
        } catch (err) {
            document.getElementById(typingId)?.remove();
            appendMessage('bot', 'Bir ağ hatası oluştu, lütfen tekrar deneyin.');
        }
    });

    function appendMessage(role, text) {
        // Convert simple markdown to HTML (bold and lines)
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
        const msgHtml = `<div class="chat-msg ${role}">${formattedText}</div>`;
        wishbotMessages.insertAdjacentHTML('beforeend', msgHtml);
        wishbotMessages.scrollTop = wishbotMessages.scrollHeight;
    }
});
