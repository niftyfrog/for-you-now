/**
 * Screen A: Home
 * 大ボタン「For you」+ エリア入力 + 設定
 */
import { gatherContext, getGeolocation } from '../engine/context.js';

// 既知のエリアの座標（福岡）
const AREA_COORDS = {
  '天神': { lat: 33.5900, lng: 130.3990 },
  '博多': { lat: 33.5903, lng: 130.4178 },
  '中洲': { lat: 33.5905, lng: 130.4053 },
  '薬院': { lat: 33.5805, lng: 130.3960 },
  '大濠': { lat: 33.5868, lng: 130.3789 },
  '西新': { lat: 33.5836, lng: 130.3563 },
  '百道': { lat: 33.5920, lng: 130.3465 },
  '赤坂': { lat: 33.5856, lng: 130.3893 },
  '六本松': { lat: 33.5776, lng: 130.3818 },
  '姪浜': { lat: 33.5830, lng: 130.3270 },
  '香椎': { lat: 33.6567, lng: 130.4457 },
  '箱崎': { lat: 33.6247, lng: 130.4275 },
  '福岡空港': { lat: 33.5859, lng: 130.4506 },
  '太宰府': { lat: 33.5220, lng: 130.5353 },
};

export function renderHome(app, onSearch) {
  app.innerHTML = `
    <div class="home-screen" id="home-screen">
      <div class="home-bg-effects">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <div class="home-content">
        <div class="brand">
          <h1 class="brand-name">HIMA<span class="brand-accent">PUSH</span></h1>
          <p class="brand-sub">今この瞬間の、ちょっといいこと</p>
        </div>

        <button class="main-button" id="main-button">
          <span class="main-button-inner">
            <span class="main-button-text">For you</span>
            <span class="main-button-sub">タップして提案を見る</span>
          </span>
          <div class="main-button-ripple"></div>
        </button>

        <div class="location-status" id="location-status">
          <div class="status-dot"></div>
          <span class="status-text">位置情報を確認中...</span>
        </div>

        <div class="area-input-section" id="area-input-section" style="display: none;">
          <p class="area-label">エリアを入力してください</p>
          <div class="area-input-wrap">
            <input type="text" class="area-input" id="area-input" 
              placeholder="例: 天神、博多、中洲..." 
              list="area-list" autocomplete="off" />
            <datalist id="area-list">
              ${Object.keys(AREA_COORDS).map(a => `<option value="${a}">`).join('')}
            </datalist>
          </div>
        </div>

        <div class="settings-section" id="settings-section">
          <button class="settings-toggle" id="settings-toggle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            設定
          </button>
          <div class="settings-panel" id="settings-panel" style="display: none;">
            <div class="setting-item">
              <label class="setting-label">移動手段</label>
              <div class="setting-options">
                <button class="setting-opt active" data-transport="walk" id="opt-walk">🚶 徒歩</button>
                <button class="setting-opt" data-transport="transit" id="opt-transit">🚃 公共交通</button>
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">距離上限</label>
              <div class="setting-slider-wrap">
                <input type="range" class="setting-slider" id="distance-slider" min="1" max="30" value="5" />
                <span class="setting-slider-value" id="distance-value">5km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 状態
  let geoLocation = null;
  let transport = 'walk';
  let maxDistance = 5;

  const mainButton = document.getElementById('main-button');
  const locationStatus = document.getElementById('location-status');
  const areaSection = document.getElementById('area-input-section');
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  const distanceSlider = document.getElementById('distance-slider');
  const distanceValue = document.getElementById('distance-value');

  // 位置情報を試みる
  tryGeolocation();

  async function tryGeolocation() {
    geoLocation = await getGeolocation();
    if (geoLocation) {
      locationStatus.querySelector('.status-dot').classList.add('active');
      locationStatus.querySelector('.status-text').textContent = '位置情報を取得しました';
      areaSection.style.display = 'none';
    } else {
      locationStatus.querySelector('.status-dot').classList.add('inactive');
      locationStatus.querySelector('.status-text').textContent = '位置情報が取得できません';
      areaSection.style.display = 'block';
    }
  }

  // メインボタン
  mainButton.addEventListener('click', async () => {
    mainButton.classList.add('loading');
    mainButton.querySelector('.main-button-text').textContent = '...';
    mainButton.querySelector('.main-button-sub').textContent = 'ベストを探してます';

    let location = geoLocation;

    // エリア入力から座標を取得
    if (!location) {
      const areaInput = document.getElementById('area-input');
      const areaName = areaInput?.value?.trim();
      if (areaName && AREA_COORDS[areaName]) {
        location = AREA_COORDS[areaName];
      } else if (areaName) {
        // 部分一致を試みる
        const match = Object.keys(AREA_COORDS).find(k => k.includes(areaName) || areaName.includes(k));
        if (match) {
          location = AREA_COORDS[match];
        } else {
          // デフォルトは天神
          location = AREA_COORDS['天神'];
        }
      } else {
        location = AREA_COORDS['天神'];
      }
    }

    const context = await gatherContext(location);
    const settings = { transport, maxDistance };

    onSearch(context, settings);
  });

  // 設定トグル
  settingsToggle.addEventListener('click', () => {
    const isOpen = settingsPanel.style.display !== 'none';
    settingsPanel.style.display = isOpen ? 'none' : 'block';
    settingsToggle.classList.toggle('open', !isOpen);
  });

  // 移動手段切替
  document.getElementById('opt-walk').addEventListener('click', (e) => {
    transport = 'walk';
    document.querySelectorAll('.setting-opt').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
  });
  document.getElementById('opt-transit').addEventListener('click', (e) => {
    transport = 'transit';
    document.querySelectorAll('.setting-opt').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
  });

  // 距離スライダー
  distanceSlider.addEventListener('input', (e) => {
    maxDistance = parseInt(e.target.value);
    distanceValue.textContent = `${maxDistance}km`;
  });
}
