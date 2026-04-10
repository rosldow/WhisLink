const urlParams = new URLSearchParams(window.location.search);
const listToken = urlParams.get('token');

let currentProducts = [];
let isOwnerSession = false;
let dragSrcEl = null;

if (!listToken) {
    document.getElementById('listTitleName').textContent = "Hata: Liste bulunamadı.";
    document.getElementById('listDescText').textContent = "Geçerli bir paylaşım linki (token) gereklidir.";
} else {
    document.addEventListener('DOMContentLoaded', () => {
        loadListInfo();
        loadProducts();

        const addLinkForm = document.getElementById('addLinkForm');
        if (addLinkForm) {
            addLinkForm.addEventListener('submit', handleAddProduct);
        }

        // Close Modals
        document.getElementById('closeEditModal')?.addEventListener('click', () => {
            document.getElementById('editModal').classList.add('hidden');
        });
        document.getElementById('closeReserveModal')?.addEventListener('click', () => {
            document.getElementById('reserveModal').classList.add('hidden');
        });

        // Reserve Form
        document.getElementById('reserveForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('reserveProductId').value;
            const name = document.getElementById('reserveName').value;
            try {
                const res = await fetch(`/api/products/${id}/reserve`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reserver_name: name })
                });
                if(res.ok) {
                    showToast("Başarıyla rezerve edildi! 🎁");
                    document.getElementById('reserveModal').classList.add('hidden');
                    loadProducts();
                } else {
                    showToast("Hata: " + (await res.json()).error, "error");
                }
            } catch(e) { showToast("Sunucu hatası", "error"); }
        });

        // Edit Form
        document.getElementById('editForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editProductId').value;
            const title = document.getElementById('editTitle').value;
            const price = document.getElementById('editPrice').value;
            const image = document.getElementById('editImage').value;

            try {
                const res = await fetch(`/api/products/${id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    body: JSON.stringify({ title, price, image })
                });
                if (res.ok) {
                    showToast("Ürün güncellendi!");
                    document.getElementById('editModal').classList.add('hidden');
                    loadProducts();
                } else {
                    showToast("Hata oluştu", "error");
                }
            } catch (e) {
                showToast("Sunucu hatası", "error");
            }
        });

        // Filters
        document.getElementById('sortSelect')?.addEventListener('change', renderProducts);
        document.getElementById('storeSelect')?.addEventListener('change', renderProducts);

        // Share button
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href);
            showToast('Liste linki kopyalandı! 🚀');
        });
    });
}

function getAuthHeaders() {
    const token = localStorage.getItem('wishlink_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function loadListInfo() {
    try {
        const res = await fetch(`/api/public-list/${listToken}`);
        if (res.ok) {
            const data = await res.json();
            const list = data.list;
            document.getElementById('listTitleName').textContent = list.name;
            document.getElementById('listDescText').textContent = list.description || "";
            document.getElementById('listOwner').textContent = list.username + "'in Listesi";
            
            // Profile Info
            if (list.avatar_url) {
                document.getElementById('ownerAvatar').src = list.avatar_url;
                document.getElementById('ownerAvatar').style.display = 'block';
            } else {
                document.getElementById('ownerAvatar').src = `https://ui-avatars.com/api/?name=${list.username}&background=random`;
                document.getElementById('ownerAvatar').style.display = 'block';
            }
            if (list.bio) {
                document.getElementById('ownerBio').textContent = list.bio;
                document.getElementById('ownerBio').style.display = 'block';
            }
        }
    } catch (e) { console.error("List info load failed", e); }
}

async function loadProducts() {
    try {
        const fetchHeaders = getAuthHeaders(); // We send token if logged in to check owner privileges
        const res = await fetch(`/api/products?token=${listToken}`, { headers: fetchHeaders });
        
        if (res.ok) {
            const data = await res.json();
            currentProducts = data.products;
            isOwnerSession = data.isOwner;
            
            if (isOwnerSession) {
                document.querySelectorAll('.owner-only').forEach(el => el.classList.remove('hidden'));
                document.body.classList.add('owner-view');
            }
            
            renderProducts();
        } else {
            console.error("Failed to fetch products.");
        }
    } catch (e) {
        console.error("Products load failed", e);
    }
}

function processPrice(priceStr) {
    if(!priceStr) return 0;
    const num = parseFloat(priceStr.replace(/[^0-9,.]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    const noMsg = document.getElementById('noProductsMsg');
    
    let filtered = [...currentProducts];

    // Store Filter
    const storeSel = document.getElementById('storeSelect').value;
    if (storeSel !== 'all') {
        filtered = filtered.filter(p => p.store === storeSel);
    }

    // Sort Filter
    const sortSel = document.getElementById('sortSelect').value;
    if (sortSel === 'price_asc') {
        filtered.sort((a,b) => processPrice(a.price) - processPrice(b.price));
    } else if (sortSel === 'price_desc') {
        filtered.sort((a,b) => processPrice(b.price) - processPrice(a.price));
    } 
    // Default uses original array order (which is sorted by sort_order from backend)

    if (filtered.length === 0) {
        container.innerHTML = '';
        noMsg.classList.remove('hidden');
        return;
    }
    noMsg.classList.add('hidden');

    container.innerHTML = filtered.map((p, index) => {
        let badgeHtml = '';
        let interactionHtml = '';

        if (p.status === 'claimed') {
            if (isOwnerSession) { 
                // CENSORD VIEW: Owner cannot see it is claimed due to backend hiding!
                // But just in case backend sent claimed status, we ignore it. The backend actually hides reserved_by.
                // However, the backend doesn't hide status currently in my script. Wait, I told backend to clear reserved_by.
                // I will assume owner sees everything as available to truly protect surprise.
                badgeHtml = `<span class="product-status">Eklendi</span>`;
                interactionHtml = `
                    <div class="product-actions">
                        <button onclick="window.open('${p.url}', '_blank')" class="btn btn-outline action-btn"><i class="ri-shopping-bag-3-line"></i> Mağazaya Git</button>
                        <button onclick="openEditModal('${p.id}')" class="action-btn-icon"><i class="ri-edit-line"></i></button>
                        <button onclick="deleteProduct('${p.id}')" class="action-btn-icon"><i class="ri-delete-bin-line"></i></button>
                    </div>
                `;
            } else {
                // Visitor sees it's claimed
                badgeHtml = `<span class="product-status" style="background:#f59e0b;"><i class="ri-user-smile-line"></i> ${p.reserved_by} aldı</span>`;
                interactionHtml = `
                    <div class="product-actions">
                        <button onclick="window.open('${p.url}', '_blank')" class="btn btn-outline action-btn"><i class="ri-shopping-bag-3-line"></i> Ürünü İncele</button>
                    </div>
                `;
            }
        } else {
            // AVAILABLE
            badgeHtml = `<span class="product-status">İstiyor</span>`;
            if (isOwnerSession) {
                interactionHtml = `
                    <div class="product-actions">
                        <button onclick="window.open('${p.url}', '_blank')" class="btn btn-outline action-btn"><i class="ri-shopping-bag-3-line"></i> Mağazaya Git</button>
                        <button onclick="openEditModal('${p.id}')" class="action-btn-icon"><i class="ri-edit-line"></i></button>
                        <button onclick="deleteProduct('${p.id}')" class="action-btn-icon"><i class="ri-delete-bin-line"></i></button>
                    </div>
                `;
            } else {
                interactionHtml = `
                    <div class="product-actions">
                        <button onclick="window.open('${p.url}', '_blank')" class="btn btn-outline action-btn"><i class="ri-shopping-bag-3-line"></i> İncele</button>
                        <button onclick="openReserveModal('${p.id}')" class="btn guest-reserve-btn action-btn"><i class="ri-gift-line"></i> Ben Alacağım</button>
                    </div>
                `;
            }
        }

        const dragAttributes = (isOwnerSession && sortSel === 'default' && storeSel === 'all') 
                               ? `draggable="true" ondragstart="handleDragStart(event)" ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${p.id}')" ondragend="handleDragEnd(event)"` 
                               : '';

        return `
            <div class="product-card ${isOwnerSession && sortSel === 'default' && storeSel === 'all' ? 'draggable' : ''}" data-id="${p.id}" ${dragAttributes}>
                ${isOwnerSession ? '<div class="drag-handle"><i class="ri-drag-move-2-fill"></i></div>' : ''}
                <div class="product-image-container">
                    <span class="product-store-badge">${p.store}</span>
                    ${badgeHtml}
                    <img src="${p.image}" alt="Product" class="product-img">
                </div>
                <div class="product-info">
                    <h3 class="product-title" title="${p.title}">${p.title}</h3>
                    <p class="product-price">${p.price}</p>
                    ${interactionHtml}
                </div>
            </div>
        `;
    }).join('');
}


// --- DRAG AND DROP ---
function handleDragStart(e) {
    dragSrcEl = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrcEl.dataset.id);
    setTimeout(() => { dragSrcEl.style.opacity = '0.4'; }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.product-card');
    if(card && card !== dragSrcEl) {
        card.classList.add('drag-over');
    }
    return false;
}

function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.product-card').forEach(c => c.classList.remove('drag-over'));
}

async function handleDrop(e, targetId) {
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('text/plain');
    document.querySelectorAll('.product-card').forEach(c => c.classList.remove('drag-over'));
    
    if (sourceId && sourceId !== targetId) {
        // Reorder in memory
        const sourceIndex = currentProducts.findIndex(p => p.id === sourceId);
        const targetIndex = currentProducts.findIndex(p => p.id === targetId);
        
        const movedItem = currentProducts.splice(sourceIndex, 1)[0];
        currentProducts.splice(targetIndex, 0, movedItem);
        
        renderProducts();

        // Send new order to server
        const newOrder = currentProducts.map((p, index) => ({ id: p.id, sort_order: index }));
        
        try {
            await fetch('/api/products/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ items: newOrder })
            });
        } catch(err) {
            console.error("Reorder failed to save to server", err);
        }
    }
    return false;
}

// --- INTERACTIONS ---

async function handleAddProduct(e) {
    e.preventDefault();
    const urlInput = document.getElementById('productUrl');
    const loading = document.getElementById('loadingIndicator');
    const addBtn = document.getElementById('addBtn');
    
    const url = urlInput.value;
    if (!url) return;

    // Show loading UI
    urlInput.disabled = true;
    addBtn.disabled = true;
    loading.classList.remove('hidden');

    try {
        const res = await fetch('/api/products/scrape', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ url, token: listToken })
        });
        
        if (res.ok) {
            showToast("Ürün başarıyla listeye eklendi!");
            urlInput.value = '';
            loadProducts();
        } else {
            const errData = await res.json();
            showToast(errData.error || "Ürün eklenemedi.", "error");
        }
    } catch (e) {
        showToast("Sunucu ile iletişim kurulamadı.", "error");
    } finally {
        urlInput.disabled = false;
        addBtn.disabled = false;
        loading.classList.add('hidden');
    }
}

function openEditModal(id) {
    const p = currentProducts.find(x => x.id === id);
    if(p) {
        document.getElementById('editProductId').value = p.id;
        document.getElementById('editTitle').value = p.title;
        document.getElementById('editPrice').value = p.price;
        document.getElementById('editImage').value = p.image;
        document.getElementById('editModal').classList.remove('hidden');
    }
}

function openReserveModal(id) {
    document.getElementById('reserveProductId').value = id;
    document.getElementById('reserveModal').classList.remove('hidden');
}

async function deleteProduct(id) {
    if (!confirm('Bu ürünü listeden silmek istediğinize emin misiniz?')) return;
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            showToast("Ürün silindi.");
            loadProducts();
        } else showToast("Hata oluştu", "error");
    } catch (e) {
        showToast("Sunucu hatası", "error");
    }
}
