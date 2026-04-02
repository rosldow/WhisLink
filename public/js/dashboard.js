document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) {
        window.location.href = 'index.html'; 
        return;
    }

    document.getElementById('welcomeUser').innerText = localStorage.getItem('wishlink_username') + "'in Paneli";
    
    document.getElementById('dashLogoutBtn').addEventListener('click', () => {
        clearToken();
        window.location.href = 'index.html';
    });

    const listModal = document.getElementById('listModal');
    document.getElementById('newListBtn').addEventListener('click', () => listModal.classList.remove('hidden'));
    document.getElementById('closeListModal').addEventListener('click', () => listModal.classList.add('hidden'));

    const createListForm = document.getElementById('createListForm');
    const listsGrid = document.getElementById('listsGrid');

    createListForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('listName').value;
        const description = document.getElementById('listDesc').value;

        try {
            const res = await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ name, description })
            });
            if (res.ok) {
                showToast("Liste oluşturuldu!");
                listModal.classList.add('hidden');
                createListForm.reset();
                loadLists();
            } else {
                showToast("Liste oluşturulamadı.");
            }
        } catch(e) {
             showToast("Hata oluştu.");
        }
    });

    async function loadLists() {
        try {
            const res = await fetch('/api/lists', { headers: getAuthHeaders() });
            const data = await res.json();
            listsGrid.innerHTML = '';

            if (data.lists && data.lists.length > 0) {
                data.lists.forEach(list => {
                    const card = document.createElement('div');
                    card.className = 'glass list-card';
                    card.style.padding = "24px";
                    card.style.borderRadius = "16px";
                    card.style.display = "flex";
                    card.style.flexDirection = "column";
                    card.style.gap = "8px";
                    card.style.transition = "transform 0.2s, box-shadow 0.2s";

                    card.innerHTML = `
                        <h3 style="font-size:1.2rem; font-weight:700;">${list.name}</h3>
                        <p class="text-muted" style="font-size:0.9rem;">${list.description || "Açıklama yok"}</p>
                        <a href="wishlist.html?id=${list.id}" class="btn btn-outline btn-sm" style="margin-top: 16px;">Yönet / Görüntüle</a>
                    `;
                    
                    card.onmouseover = () => { card.style.transform = 'translateY(-5px)'; card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)'; };
                    card.onmouseout = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };

                    listsGrid.appendChild(card);
                });
            } else {
                listsGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align:center; margin-top:30px;">Görünüşe göre hiç listen yok. Yukarıdan oluştur!</p>';
            }
        } catch(e) {
            showToast("Listeler yüklenemedi.");
        }
    }

    loadLists();
});
