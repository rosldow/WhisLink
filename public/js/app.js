document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('id');

    if (!listId) {
        document.body.innerHTML = "<h2 style='text-align:center; margin-top:20vh;'>Liste bulunamadı (ID eksik). Panelinizden bir listeye tıklayın.</h2>";
        return;
    }

    const productsGrid = document.getElementById('productsGrid');
    const noProductsMsg = document.getElementById('noProductsMsg');
    const addLinkForm = document.getElementById('addLinkForm');
    const productUrlInput = document.getElementById('productUrl');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const addBtn = document.getElementById('addBtn');
    const addItemSection = document.getElementById('addItemSection');

    // UI elements
    const listOwnerSpan = document.getElementById('listOwner');
    const listTitleName = document.getElementById('listTitleName');
    const listDescText = document.getElementById('listDescText');
    const backToDashBtn = document.getElementById('backToDashBtn');

    // Edit Modal Elements
    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const editForm = document.getElementById('editForm');
    const editTitle = document.getElementById('editTitle');
    const editPrice = document.getElementById('editPrice');
    const editImage = document.getElementById('editImage');
    const editProductId = document.getElementById('editProductId');

    let currentListOwnerUsername = "";
    const loggedInUser = localStorage.getItem('wishlink_username');

    if (closeEditModal) closeEditModal.addEventListener('click', () => editModal.classList.add('hidden'));

    async function loadListDetails() {
        try {
            const res = await fetch(`/api/lists/${listId}`);
            if (res.ok) {
                const data = await res.json();
                listTitleName.innerText = data.list.name;
                listDescText.innerText = data.list.description || "";
                currentListOwnerUsername = data.list.username;

                listOwnerSpan.innerText = `${currentListOwnerUsername}'in Listesi`;

                if (loggedInUser === currentListOwnerUsername && getToken()) {
                    addItemSection.classList.remove('hidden');
                    backToDashBtn.classList.remove('hidden');
                }
                
                loadProducts();
            } else {
                listTitleName.innerText = "Liste Bulunamadı";
            }
        } catch(e) {
            console.error("No list");
        }
    }

    async function loadProducts() {
        if (!productsGrid) return;
        
        try {
            const res = await fetch(`/api/products?list_id=${listId}`);
            const data = await res.json();
            
            productsGrid.innerHTML = '';
            
            const isOwner = (loggedInUser === currentListOwnerUsername && getToken());

            if(data.products.length === 0) {
                noProductsMsg.classList.remove('hidden');
            } else {
                noProductsMsg.classList.add('hidden');
                data.products.forEach(product => {
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    
                    const isClaimed = product.status === 'claimed';
                    
                    let actionsHtml = `<a href="${product.url}" target="_blank" class="btn btn-primary action-btn">Ürüne Git</a>`;
                    
                    if (isOwner) {
                        actionsHtml += `
                            <button class="action-btn-icon edit-btn" data-id="${product.id}" title="Düzenle">
                                <i class="ri-edit-line"></i>
                            </button>
                            <button class="action-btn-icon delete-btn" data-id="${product.id}" title="Listeden Çıkar">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        `;
                    }
                    
                    card.innerHTML = `
                        <div class="product-image-container">
                            <div class="product-store-badge">${product.store}</div>
                            ${isClaimed ? '<div class="product-status"><i class="ri-check-line"></i> Alındı</div>' : ''}
                            <img src="${product.image}" alt="${product.title}" class="product-img">
                        </div>
                        <div class="product-info">
                            <h3 class="product-title" title="${product.title}">${product.title}</h3>
                            <div class="product-price">${product.price}</div>
                            <div class="product-actions" style="display:flex; justify-content:space-between; width:100%; gap:8px;">
                                ${actionsHtml}
                            </div>
                        </div>
                    `;
                    
                    if (isOwner) {
                        const deleteBtn = card.querySelector('.delete-btn');
                        deleteBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            if(confirm("Silmek istediğinize emin misiniz?")) {
                                deleteProduct(product.id, card);
                            }
                        });

                        const editBtn = card.querySelector('.edit-btn');
                        editBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            editProductId.value = product.id;
                            editTitle.value = product.title;
                            editPrice.value = product.price;
                            editImage.value = product.image;
                            editModal.classList.remove('hidden');
                        });
                    }

                    productsGrid.appendChild(card);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    if (addLinkForm) {
        addLinkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = productUrlInput.value.trim();
            if (!url) return;

            addBtn.disabled = true;
            loadingIndicator.classList.remove('hidden');

            try {
                const res = await fetch('/api/products/scrape', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ url, list_id: listId })
                });

                if (res.ok) {
                    showToast("Ürün başarıyla listeye eklendi!");
                    loadProducts();
                } else {
                    showToast("Ürün eklenirken bir sorun oluştu.");
                }
            } catch (error) {
                showToast("Sunucuyla bağlantı kurulamadı.");
            } finally {
                productUrlInput.value = '';
                addBtn.disabled = false;
                loadingIndicator.classList.add('hidden');
            }
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = editProductId.value;
            const title = editTitle.value;
            const price = editPrice.value;
            const image = editImage.value;

            try {
                const res = await fetch(`/api/products/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ title, price, image })
                });
                
                if (res.ok) {
                    showToast("Ürün güncellendi!");
                    editModal.classList.add('hidden');
                    loadProducts();
                } else {
                    showToast("Güncelleme başarısız.");
                }
            } catch(e) {
                showToast("Hata oluştu.");
            }
        });
    }

    async function deleteProduct(id, cardElement) {
        try {
            const res = await fetch(`/api/products/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                cardElement.style.transform = 'scale(0.8)';
                cardElement.style.opacity = '0';
                setTimeout(() => {
                    loadProducts();
                    showToast("Ürün listeden çıkarıldı.");
                }, 300);
            } else {
                showToast("Silinemedi.");
            }
        } catch(err) {
            showToast("Hata oluştu.");
        }
    }

    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href);
            showToast("Liste linki kopyalandı! Arkadaşlarına gönderebilirsin.");
        });
    }

    loadListDetails();
});
