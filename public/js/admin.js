document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('wishlink_token');
    const role = localStorage.getItem('wishlink_role');
    
    // Güvenlik kontrolü: Sadece adminler girebilir
    if (!token || role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('welcomeUser').textContent = localStorage.getItem('wishlink_username');

    // İstatistikleri Yükle
    try {
        const statsRes = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
            const stats = await statsRes.json();
            document.getElementById('statUsers').textContent = stats.users;
            document.getElementById('statLists').textContent = stats.lists;
            document.getElementById('statProducts').textContent = stats.products;
        }
    } catch (e) {
        console.error('Stats error', e);
    }

    // Üyeleri Yükle
    loadUsers();
});

async function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    const token = localStorage.getItem('wishlink_token');
    
    try {
        const res = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.users.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Kayıtlı üye yok</td></tr>';
                return;
            }
            
            tableBody.innerHTML = data.users.map(u => `
                <tr>
                    <td>#${u.id}</td>
                    <td><strong>${u.username}</strong></td>
                    <td>${u.role === 'admin' ? '<span class="badge-admin">Admin</span>' : '<span style="color:var(--text-muted)">Üye</span>'}</td>
                    <td>${u.list_count} Liste</td>
                    <td>${new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                    <td>
                        ${u.role !== 'admin' ? 
                            `<button onclick="deleteUser(${u.id})" class="btn btn-sm" style="background:rgba(255, 71, 87, 0.2);color:#ff4757;border:1px solid #ff4757;">Sil</button>` 
                            : '<span class="text-muted" style="font-size:0.8rem">Korumalı</span>'}
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        showToast("Kullanıcılar yüklenemedi", "error");
    }
}

async function deleteUser(id) {
    if (!confirm('Bu üyeyi sistemden tamamen silmek istediğinize emin misiniz? (Üyenin tüm listeleri ve ürünleri de silinir)')) return;
    
    const token = localStorage.getItem('wishlink_token');
    try {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            showToast("Üye başarıyla silindi");
            loadUsers(); // Tabloyu yenile
        } else {
            showToast("Silme işlemi başarısız", "error");
        }
    } catch (e) {
        showToast("Sunucu hatası", "error");
    }
}
