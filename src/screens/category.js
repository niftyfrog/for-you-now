/**
 * Screen: Category Drill-down
 * マッチングアプリ風スワイプ + リスト切替
 */
import { getMoreCards } from '../engine/filter.js';
import { renderBottomNav } from './home.js';

const CATEGORY_NAMES = {
    scenery: '自然スポット一覧',
    food: '食事スポット一覧',
    rest: '休憩スポット一覧',
    limited: '限定スポット一覧',
};

const CATEGORY_FILTERS = {
    scenery: ['すべて', '公園', '展望台', '海辺'],
    food: ['すべて', 'ラーメン', '和食', '洋食'],
    rest: ['すべて', 'カフェ', 'スパ・温泉', 'ラウンジ'],
    limited: ['すべて', 'イベント', '展示', 'フェス'],
};

const CATEGORY_IMAGES = {
    scenery: '/images/category_nature.png',
    food: '/images/category_food.png',
    rest: '/images/category_rest.png',
    limited: '/images/category_limited.png',
};

export async function renderCategory(app, category, context, settings, onDetail, onBack) {
    const title = CATEGORY_NAMES[category] || 'スポット一覧';
    const filters = CATEGORY_FILTERS[category] || ['すべて'];
    const defaultImage = CATEGORY_IMAGES[category];

    // ローディング表示
    app.innerHTML = `
    <div class="category-screen">
      <div class="cat-header">
        <button class="cat-back-btn" id="cat-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="cat-title">${title}</span>
        <button class="cat-view-toggle" id="cat-view-toggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </button>
      </div>
      <div style="display:flex;justify-content:center;align-items:center;min-height:400px;">
        <div class="loading-spinner"></div>
      </div>
      ${renderBottomNav('nearby')}
    </div>
  `;
    document.getElementById('cat-back')?.addEventListener('click', onBack);

    // データ取得
    const items = await getMoreCards(category, '', context, settings);

    let viewMode = 'swipe'; // 'swipe' or 'list'
    let currentIndex = 0;

    function render() {
        app.innerHTML = `
      <div class="category-screen">
        <div class="cat-header">
          <button class="cat-back-btn" id="cat-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="cat-title">${title}</span>
          <button class="cat-view-toggle" id="cat-view-toggle">
            ${viewMode === 'swipe' ? `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            ` : `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            `}
          </button>
        </div>

        <div class="cat-filters">
          ${filters.map((f, i) => `
            <button class="cat-filter-btn ${i === 0 ? 'active' : ''}">${f}</button>
          `).join('')}
        </div>

        ${viewMode === 'swipe' ? renderSwipeView(items, currentIndex, defaultImage) : renderListView(items, defaultImage)}

        ${renderBottomNav('nearby')}
      </div>
    `;

        bindEvents();
    }

    function bindEvents() {
        document.getElementById('cat-back')?.addEventListener('click', onBack);

        // ビュー切替
        document.getElementById('cat-view-toggle')?.addEventListener('click', () => {
            viewMode = viewMode === 'swipe' ? 'list' : 'swipe';
            render();
        });

        // フィルタータブ
        document.querySelectorAll('.cat-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        if (viewMode === 'swipe') {
            // スワイプアクションボタン
            document.getElementById('action-nope')?.addEventListener('click', () => {
                if (currentIndex < items.length - 1) {
                    currentIndex++;
                    render();
                }
            });
            document.getElementById('action-like')?.addEventListener('click', () => {
                const item = items[currentIndex];
                if (item) onDetail(item);
            });
            document.getElementById('action-super')?.addEventListener('click', () => {
                const item = items[currentIndex];
                if (item) {
                    // Google Map で開く
                    if (item.lat && item.lng) {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`, '_blank');
                    }
                }
            });
            document.getElementById('action-back-btn')?.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    render();
                }
            });

            // カードクリックで詳細へ
            document.querySelector('.swipe-card')?.addEventListener('click', () => {
                const item = items[currentIndex];
                if (item) onDetail(item);
            });
        } else {
            // リストカードクリック
            document.querySelectorAll('.list-card').forEach(cardEl => {
                cardEl.addEventListener('click', () => {
                    const id = cardEl.dataset.id;
                    const item = items.find(c => c.id === id);
                    if (item) onDetail(item);
                });
            });

            // 地図ボタン
            document.querySelectorAll('.list-card-map-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const lat = btn.dataset.lat;
                    const lng = btn.dataset.lng;
                    if (lat && lng) {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                    }
                });
            });
        }
    }

    render();
}

function renderSwipeView(items, currentIndex, defaultImage) {
    if (items.length === 0) {
        return `<div style="text-align:center;padding:3rem;color:var(--text-muted);">このカテゴリのスポットが見つかりませんでした</div>`;
    }

    const item = items[currentIndex];
    const desc = item.line2 || '';
    const tags = item.tags || [];

    return `
    <div class="swipe-container">
      <div class="swipe-card">
        <div class="swipe-card-image">
          <img src="${item.photoUrl || defaultImage}" alt="${item.name}"
               onerror="this.src='${defaultImage}'" />
          <div class="swipe-card-overlay">
            <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
              <span class="swipe-card-location">📍 周辺エリア</span>
              <span class="swipe-card-distance">${item.travelInfo || item.line1 || ''}</span>
            </div>
            <h3 class="swipe-card-name">${item.name}</h3>
            <p class="swipe-card-desc">${desc}</p>
          </div>
        </div>
        ${tags.length > 0 ? `
          <div class="swipe-card-body">
            <div class="swipe-card-tags">
              ${tags.slice(0, 4).map(t => `<span class="swipe-tag">${t}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="swipe-actions">
        <button class="action-btn action-back" id="action-back-btn">
          <div class="action-btn-circle">↩</div>
          <span>戻る</span>
        </button>
        <button class="action-btn action-nope" id="action-nope">
          <div class="action-btn-circle">✕</div>
          <span>興味なし</span>
        </button>
        <button class="action-btn action-like" id="action-like">
          <div class="action-btn-circle">♡</div>
          <span>気になる</span>
        </button>
        <button class="action-btn action-super" id="action-super">
          <div class="action-btn-circle">⚡</div>
          <span>即予約</span>
        </button>
      </div>

      <div style="text-align:center;font-size:0.7rem;color:var(--text-muted);">
        ${currentIndex + 1} / ${items.length}
      </div>
    </div>
  `;
}

function renderListView(items, defaultImage) {
    if (items.length === 0) {
        return `<div style="text-align:center;padding:3rem;color:var(--text-muted);">スポットが見つかりませんでした</div>`;
    }

    return `
    <div class="list-container">
      ${items.map(item => `
        <div class="list-card" data-id="${item.id}">
          <div class="list-card-image-wrap">
            <img src="${item.photoUrl || defaultImage}" alt="${item.name}"
                 onerror="this.src='${defaultImage}'" />
            <button class="list-card-heart">♡</button>
          </div>
          <div class="list-card-body">
            <h3 class="list-card-name">${item.name}</h3>
            <p class="list-card-sub">${item.subcategory || ''}</p>
            <p class="list-card-desc">${item.line2 || ''}</p>
            <div class="list-card-footer">
              <span class="list-card-distance">${item.travelInfo || item.line1 || ''}</span>
              <button class="list-card-map-btn" data-lat="${item.lat}" data-lng="${item.lng}">
                📍 地図で見る
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
