document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('wishlink_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('welcomeUserText').textContent = localStorage.getItem('wishlink_username');

    document.getElementById('dashLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem('wishlink_token');
        localStorage.removeItem('wishlink_username');
        localStorage.removeItem('wishlink_role');
        window.location.href = 'index.html';
    });

    loadProfile();
    loadLists();

    // Modal Toggles
    document.getElementById('newListBtn')?.addEventListener('click', () => {
        document.getElementById('listModal').classList.remove('hidden');
    });
    document.getElementById('closeListModal')?.addEventListener('click', () => {
        document.getElementById('listModal').classList.add('hidden');
    });

    document.getElementById('createListForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('listName').value;
        const description = document.getElementById('listDesc').value;

        try {
            const res = await fetch('/api/lists', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ name, description })
            });
            if (res.ok) {
                showToast("Liste oluşturuldu!");
                document.getElementById('createListForm').reset();
                document.getElementById('listModal').classList.add('hidden');
                loadLists();
            } else {
                showToast("Hata oluştu", "error");
            }
        } catch (e) {
            showToast("Sunucu hatası", "error");
        }
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const avatar_url = document.getElementById('avatarInput').value;
        const bio = document.getElementById('bioInput').value;

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ avatar_url, bio })
            });
            if (res.ok) {
                showToast("Profil güncellendi!");
                closeProfileModal();
                loadProfile();
            } else {
                showToast("Hata oluştu", "error");
            }
        } catch (e) {
            showToast("Sunucu hatası", "error");
        }
    });
});

function openProfileModal() {
    document.getElementById('profileModal').classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.add('hidden');
}

async function loadProfile() {
    const token = localStorage.getItem('wishlink_token');
    try {
        const res = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const p = data.profile;
            document.getElementById('profileUsername').textContent = p.username;
            if (p.avatar_url) {
                document.getElementById('userAvatar').src = p.avatar_url;
                document.getElementById('avatarInput').value = p.avatar_url;
            } else {
                document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${p.username}&background=random`;
            }
            if (p.bio) {
                document.getElementById('profileBio').textContent = p.bio;
                document.getElementById('bioInput').value = p.bio;
            }
        }
    } catch (e) {
        console.error("Profile load error", e);
    }
}

async function loadLists() {
    const token = localStorage.getItem('wishlink_token');
    try {
        const res = await fetch('/api/lists', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const container = document.getElementById('listsGrid');
            
            if (data.lists.length === 0) {
                container.innerHTML = '<p class="text-muted" style="text-align: center; width: 100%;">Henüz hiç liste oluşturmadınız.</p>';
                return;
            }

            container.innerHTML = data.lists.map(list => `
                <div class="product-card">
                    <div class="product-info" style="align-items: center; justify-content: center; text-align: center; padding: 40px 20px;">
                        <h3 style="font-size: 1.5rem; margin-bottom: 15px;">${list.name}</h3>
                        ${list.description ? `<p class="text-muted" style="margin-bottom: 15px;">${list.description}</p>` : ''}
                        <div class="product-actions" style="margin-top: 20px;">
                            <button onclick="window.location.href='wishlist.html?token=${list.share_token}'" class="btn btn-primary" style="padding: 10px 20px;">İçine Git</button>
                            <button onclick="shareList('${list.share_token}')" class="btn btn-outline" style="padding: 10px 20px;"><i class="ri-share-line"></i> Paylaş</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Lists load error", e);
    }
}

function shareList(token) {
    const link = window.location.origin + '/wishlist.html?token=' + token;
    navigator.clipboard.writeText(link).then(() => {
        showToast("Liste linki kopyalandı!");
    }).catch(err => {
        showToast("Link kopyalanamadı.", "error");
    });
}
