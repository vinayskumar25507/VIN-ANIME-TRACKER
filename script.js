// CONFIG
const API_URL = "https://api.jikan.moe/v4";
let currentTab = 'all';
let currentAnimeInModal = null;

// DATABASE
let myLibrary = JSON.parse(localStorage.getItem('aniFocusDB')) || [];

// DOM Elements
const grid = document.getElementById('animeGrid');
const loading = document.getElementById('loading');
const modal = document.getElementById('animeModal');
const btns = document.querySelectorAll('.tab-btn');

// --- INITIALIZATION ---
window.onload = () => {
    switchTab('all');
};

// --- TAB LOGIC ---
function switchTab(tabName) {
    currentTab = tabName;
    btns.forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'all') {
        getTopAnime();
    } else {
        renderLibrary(tabName);
    }
}

// --- API FUNCTIONS ---
async function getTopAnime() {
    loading.style.display = 'block';
    grid.innerHTML = '';
    try {
        const response = await fetch(`${API_URL}/top/anime`);
        const data = await response.json();
        renderCards(data.data);
    } catch (error) {
        console.error(error);
        grid.innerHTML = "<p>Error loading anime.</p>";
    } finally {
        loading.style.display = 'none';
    }
}

async function searchAnime() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    switchTab('all');
    loading.style.display = 'block';
    grid.innerHTML = '';
    try {
        const response = await fetch(`${API_URL}/anime?q=${query}`);
        const data = await response.json();
        renderCards(data.data);
    } catch (error) {
        console.error(error);
    } finally {
        loading.style.display = 'none';
    }
}

// --- RENDER FUNCTIONS ---
function renderCards(animeList) {
    grid.innerHTML = '';

    animeList.forEach(anime => {
        const id = anime.mal_id || anime.id;
        const title = anime.title_english || anime.title;
        const img = anime.images ? anime.images.jpg.large_image_url : anime.image;
        let totalEps = anime.episodes || anime.totalEps || 0;
        const score = anime.score || '?';

        // Check if we have this anime in our library
        const existing = myLibrary.find(item => item.id === id);

        let watched = 0;
        if (existing) {
            watched = existing.watchedEps;
            // Use DB totalEps if API is undefined
            if (!totalEps) totalEps = existing.totalEps;
        }

        // Calculate Progress %
        let percentage = 0;
        if (totalEps > 0) {
            percentage = (watched / totalEps) * 100;
            if (percentage > 100) percentage = 100;
        }

        const card = document.createElement('div');
        card.classList.add('card');

        let htmlContent = `
            <img src="${img}" alt="${title}">
            <div class="card-info">
                <div class="card-title">${title}</div>
                <div class="card-meta">
                    <span>★ ${score}</span>
                    <span>${totalEps || '?'} Eps</span>
                </div>
        `;

        // 1. Feature: Progress Bar logic
        // Condition: Must exist in library AND current tab MUST NOT be 'all'
        if (existing && currentTab !== 'all') {
            htmlContent += `
                <div class="progress-wrapper">
                    <div class="progress-bg">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="progress-text">${watched} / ${totalEps || '?'} EP</div>
                </div>
            `;
        }

        // 2. Feature: Watch Again button
        // Condition: Must be completed AND current tab MUST NOT be 'all'
        if (existing && existing.status === 'completed' && currentTab !== 'all') {
            htmlContent += `
                <button class="btn-watch-again" onclick="event.stopPropagation(); watchAgain(${id})">Watch Again</button>
            `;
        }

        htmlContent += `</div>`; // Close card-info
        card.innerHTML = htmlContent;

        card.onclick = () => openModal(anime);
        grid.appendChild(card);
    });
}

function renderLibrary(statusFilter) {
    const filteredList = myLibrary.filter(item => item.status === statusFilter);
    if (filteredList.length === 0) {
        grid.innerHTML = `<p style="color:#ccc; margin-top:20px; padding-left: 20px;">No anime found in "${statusFilter}".</p>`;
        return;
    }
    renderCards(filteredList);
}

// --- MODAL & LOGIC ---
function openModal(anime) {
    const id = anime.mal_id || anime.id;
    const existingEntry = myLibrary.find(item => item.id === id);

    currentAnimeInModal = {
        id: id,
        title: anime.title_english || anime.title,
        image: anime.images ? anime.images.jpg.large_image_url : anime.image,
        totalEps: anime.episodes || anime.totalEps || 0,
        score: anime.score || 0,
        synopsis: anime.synopsis || "No description available."
    };

    document.getElementById('modalImg').src = currentAnimeInModal.image;
    document.getElementById('modalTitle').innerText = currentAnimeInModal.title;
    document.getElementById('modalMeta').innerText = `Score: ${currentAnimeInModal.score} • ${currentAnimeInModal.totalEps || '?'} Eps`;
    document.getElementById('modalSynopsis').innerText = currentAnimeInModal.synopsis;
    document.getElementById('modalTotalEps').innerText = `/ ${currentAnimeInModal.totalEps || '?'}`;

    const statusSelect = document.getElementById('modalStatus');
    const progressInput = document.getElementById('modalProgress');
    const deleteBtn = document.getElementById('btnDelete');

    if (existingEntry) {
        statusSelect.value = existingEntry.status;
        progressInput.value = existingEntry.watchedEps;
        deleteBtn.style.display = 'block';
    } else {
        statusSelect.value = 'watching';
        progressInput.value = 0;
        deleteBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function saveToLibrary() {
    let status = document.getElementById('modalStatus').value;
    let watched = parseInt(document.getElementById('modalProgress').value);
    const total = currentAnimeInModal.totalEps;

    // --- FEATURE LOGIC ---

    // 1. If Completed selected directly -> Set watched to Max
    if (status === 'completed') {
        if (total > 0) watched = total;
    }

    // 2. If episodes match total (and currently watching) -> Move to Completed
    if (status === 'watching' && total > 0 && watched >= total) {
        status = 'completed';
        watched = total;
    }

    // 3. If Plan to Watch and episodes > 0 -> Move to Watching
    if (status === 'plan_to_watch' && watched > 0) {
        status = 'watching';
    }

    // --- END FEATURE LOGIC ---

    const existingIndex = myLibrary.findIndex(item => item.id === currentAnimeInModal.id);

    const newEntry = {
        ...currentAnimeInModal,
        status: status,
        watchedEps: watched
    };

    if (existingIndex > -1) {
        myLibrary[existingIndex] = newEntry;
    } else {
        myLibrary.push(newEntry);
    }

    localStorage.setItem('aniFocusDB', JSON.stringify(myLibrary));
    closeModal();

    if (currentTab !== 'all') {
        renderLibrary(currentTab);
    } else {
        alert("List updated!");
    }
}

// 3. Feature: Watch Again Logic
function watchAgain(id) {
    const index = myLibrary.findIndex(item => item.id === id);
    if (index > -1) {
        // Move to Plan to Watch and Reset Progress
        myLibrary[index].status = 'plan_to_watch';
        myLibrary[index].watchedEps = 0;

        localStorage.setItem('aniFocusDB', JSON.stringify(myLibrary));

        if (currentTab !== 'all') {
            renderLibrary(currentTab);
        } else {
            alert("Moved to Plan to Watch!");
        }
    }
}

function deleteFromLibrary() {
    if (confirm("Remove this anime from your list?")) {
        myLibrary = myLibrary.filter(item => item.id !== currentAnimeInModal.id);
        localStorage.setItem('aniFocusDB', JSON.stringify(myLibrary));
        closeModal();

        if (currentTab !== 'all') renderLibrary(currentTab);
        else alert("Removed from list.");
    }
}

document.querySelector('.close-btn').onclick = closeModal;
window.onclick = function(event) {
    if (event.target == modal) closeModal();
}

function closeModal() {
    modal.style.display = "none";
}