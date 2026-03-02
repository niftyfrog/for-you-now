/**
 * Screen B: Suggestions（提案一覧）
 * 4枚カード表示 + 「もっとこの系統」
 */
import { getTopCards, getMoreCards } from '../engine/filter.js';

const CATEGORY_COLORS = {
    scenery: { gradient: 'linear-gradient(135deg, #FF6B35, #F7C948)', accent: '#FF6B35' },
    food: { gradient: 'linear-gradient(135deg, #E84855, #FF6B6B)', accent: '#E84855' },
    rest: { gradient: 'linear-gradient(135deg, #2EC4B6, #7BDFF2)', accent: '#2EC4B6' },
    limited: { gradient: 'linear-gradient(135deg, #9B5DE5, #F15BB5)', accent: '#9B5DE5' },
};

export function renderSuggestions(app, context, settings, onDetail, onBack) {
    const cards = getTopCards(context, settings);

    app.innerHTML = `
    <div class="suggestions-screen" id="suggestions-screen">
      <div class="suggestions-header">
        <button class="back-button" id="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="suggestions-title">
          <h2>For you</h2>
          <p class="suggestions-subtitle">${getTimeGreeting()}</p>
        </div>
      </div>

      <div class="cards-container" id="cards-container">
        ${cards.map((card, i) => renderCard(card, i)).join('')}
      </div>
    </div>
  `;

    // イベントバインド
    document.getElementById('back-button').addEventListener('click', onBack);

    // カードクリック → 詳細
    document.querySelectorAll('.card').forEach(cardEl => {
        cardEl.addEventListener('click', (e) => {
            // ボタンクリックの場合はバブリングしない
            if (e.target.closest('.card-action-btn')) return;
            const id = cardEl.dataset.id;
            const card = cards.find(c => c.id === id);
            if (card) onDetail(card);
        });
    });

    // 「もっとこの系統」ボタン
    document.querySelectorAll('.more-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = btn.dataset.category;
            const excludeId = btn.dataset.exclude;
            const moreContainer = document.getElementById(`more-${category}`);

            if (moreContainer.children.length > 0) {
                // 既に展開済み → トグルで閉じる
                moreContainer.innerHTML = '';
                btn.textContent = 'もっとこの系統';
                btn.classList.remove('expanded');
                return;
            }

            const moreItems = getMoreCards(category, excludeId, context, settings);
            moreContainer.innerHTML = moreItems.map((card, i) => renderMiniCard(card, i)).join('');
            btn.textContent = '閉じる';
            btn.classList.add('expanded');

            // ミニカードにもクリックイベント
            moreContainer.querySelectorAll('.mini-card').forEach(miniEl => {
                miniEl.addEventListener('click', () => {
                    const id = miniEl.dataset.id;
                    const card = moreItems.find(c => c.id === id);
                    if (card) onDetail(card);
                });
            });
        });
    });

    // 「地図で見る」ボタン
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const lat = btn.dataset.lat;
            const lng = btn.dataset.lng;
            const name = btn.dataset.name;
            if (lat && lng) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`, '_blank');
            }
        });
    });

    // 「共有」ボタン
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const name = btn.dataset.name;
            const text = btn.dataset.text;
            if (navigator.share) {
                try {
                    await navigator.share({ title: name, text });
                } catch { }
            } else {
                await navigator.clipboard?.writeText(`${name} - ${text}`);
                showToast('コピーしました！');
            }
        });
    });

    // 入場アニメーション
    requestAnimationFrame(() => {
        document.querySelectorAll('.card').forEach((card, i) => {
            card.style.animationDelay = `${i * 0.12}s`;
            card.classList.add('card-enter');
        });
    });
}

function renderCard(card, index) {
    const colors = CATEGORY_COLORS[card.category];
    return `
    <div class="card card-${card.category}" data-id="${card.id}" style="--card-accent: ${colors.accent}; --card-gradient: ${colors.gradient}; animation-delay: ${index * 0.12}s">
      <div class="card-category-badge">${card.emoji} ${card.label}</div>
      <div class="card-body">
        <h3 class="card-name">${card.name}</h3>
        <div class="card-template">
          <p class="card-line card-line-1">${card.line1}</p>
          <p class="card-line card-line-2">${card.line2}</p>
          <p class="card-line card-line-3">${card.line3}</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn map-btn" data-lat="${card.lat}" data-lng="${card.lng}" data-name="${card.name}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          地図
        </button>
        <button class="card-action-btn share-btn" data-name="${card.name}" data-text="${card.line1} ${card.line2} ${card.line3}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          共有
        </button>
        <button class="card-action-btn more-btn" data-category="${card.category}" data-exclude="${card.id}">
          もっとこの系統
        </button>
      </div>
      <div class="more-container" id="more-${card.category}"></div>
    </div>
  `;
}

function renderMiniCard(card, index) {
    return `
    <div class="mini-card" data-id="${card.id}" style="animation-delay: ${index * 0.06}s">
      <div class="mini-card-body">
        <span class="mini-card-name">${card.emoji} ${card.name}</span>
        <div class="mini-card-lines">
          <span class="mini-line">${card.line1}</span>
          <span class="mini-line">${card.line2}</span>
          <span class="mini-line">${card.line3}</span>
        </div>
      </div>
      <svg class="mini-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  `;
}

function getTimeGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '深夜のおすすめ 🌙';
    if (h < 11) return '朝のおすすめ ☀️';
    if (h < 14) return 'ランチどう？ 🍽️';
    if (h < 17) return '午後のおすすめ ☕';
    if (h < 20) return '夕方〜夜のおすすめ 🌅';
    return '夜のおすすめ 🌃';
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
