/**
 * Screen: Detail（写真付きプロフィールカード風）
 * 大きなヒーロー写真 + 情報カード + アクション
 */

const CATEGORY_COLORS = {
  scenery: '#4ECDC4',
  food: '#FF6B6B',
  rest: '#5B9BD5',
  limited: '#A584E0',
};

const CATEGORY_LABELS = {
  scenery: '🌿 自然',
  food: '🍽 食事',
  rest: '☕ 休憩',
  limited: '📅 限定',
};

const CATEGORY_IMAGES = {
  scenery: '/images/category_nature.png',
  food: '/images/category_food.png',
  rest: '/images/category_rest.png',
  limited: '/images/category_limited.png',
};

export function renderDetail(app, card, onBack) {
  const accentColor = CATEGORY_COLORS[card.category] || '#A584E0';
  const label = CATEGORY_LABELS[card.category] || '📍 スポット';
  const fallbackImage = CATEGORY_IMAGES[card.category] || '/images/category_food.png';
  const photoSrc = card.photoUrl || fallbackImage;

  app.innerHTML = `
    <div class="detail-screen" id="detail-screen">
      <!-- ヘッダー -->
      <div class="detail-header">
        <button class="back-button" id="detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="detail-badge" style="color:${accentColor}; background: ${accentColor}15;">${label}</div>
      </div>

      <!-- ヒーロー写真 -->
      <div class="detail-photo-hero">
        <img src="${photoSrc}" alt="${card.name}" class="detail-photo-img"
             onerror="this.src='${fallbackImage}'" />
        <div class="detail-photo-overlay">
          <div class="detail-photo-badge-row">
            ${card.travelInfo ? `<span class="detail-photo-distance">🚶 ${card.travelInfo}</span>` : ''}
          </div>
          <h1 class="detail-photo-name">${card.name}</h1>
          <p class="detail-photo-sub">${card.subcategory || ''}</p>
        </div>
      </div>

      <!-- プロフィールカード -->
      <div class="detail-profile-card">
        <div class="detail-reason-row">
          <p class="detail-reason-text">${card.line2 || ''}</p>
          <p class="detail-reason-invite">${card.line3 || ''}</p>
        </div>
      </div>

      <!-- 情報セクション -->
      <div class="detail-info-section">
        <h3 class="detail-info-title">スポット情報</h3>
        <div class="detail-info">
          <div class="detail-info-row">
            <span class="detail-info-icon">📍</span>
            <span class="detail-info-text">${card.address || '住所不明'}</span>
          </div>
          ${card.openHours ? `
          <div class="detail-info-row">
            <span class="detail-info-icon">🕐</span>
            <span class="detail-info-text">${card.openHours.open} 〜 ${card.openHours.close}</span>
          </div>
          ` : ''}
          <div class="detail-info-row">
            <span class="detail-info-icon">💰</span>
            <span class="detail-info-text">${card.budgetRange || '不明'}</span>
          </div>
          ${card.travelInfo ? `
          <div class="detail-info-row">
            <span class="detail-info-icon">🚶</span>
            <span class="detail-info-text">${card.travelInfo}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- タグ -->
      ${card.tags?.length ? `
      <div class="detail-tags-section">
        <div class="detail-tags">
          ${card.tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      <!-- アクションボタン -->
      <div class="detail-actions">
        ${card.lat && card.lng ? `
        <a class="detail-action-btn detail-action-primary" href="https://www.google.com/maps/search/?api=1&query=${card.lat},${card.lng}" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Google Mapで開く
        </a>
        ` : ''}
        ${card.sourceUrl ? `
        <a class="detail-action-btn detail-action-secondary" href="${card.sourceUrl}" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          公式サイト
        </a>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('detail-back').addEventListener('click', onBack);

  requestAnimationFrame(() => {
    document.getElementById('detail-screen').classList.add('detail-enter');
  });
}
