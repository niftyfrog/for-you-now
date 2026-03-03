/**
 * Hotpepper グルメサーチ API クライアント
 * ユーザー周辺の飲食店を動的に取得
 */

const API_KEY = 'e91e513346fd0ba2';
const BASE_URL = '/api/hotpepper/gourmet/v1/';

// range: 1=300m, 2=500m, 3=1000m, 4=2000m, 5=3000m
const RANGE_MAP = {
    1: 300,
    2: 500,
    3: 1000,
    4: 2000,
    5: 3000,
};

/**
 * 距離上限(km)からrangeパラメータを決定
 */
function distanceToRange(maxDistanceKm) {
    const m = maxDistanceKm * 1000;
    if (m <= 300) return 1;
    if (m <= 500) return 2;
    if (m <= 1000) return 3;
    if (m <= 2000) return 4;
    return 5;
}

// キャッシュ（同一リクエストの再取得防止）
const cache = new Map();

/**
 * 周辺の飲食店を検索
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @param {number} maxDistanceKm - 距離上限 (km)
 * @returns {Promise<Array>} アプリ共通スポット形式の配列
 */
export async function searchNearbyRestaurants(lat, lng, maxDistanceKm = 3) {
    const range = distanceToRange(maxDistanceKm);
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${range}`;

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const params = new URLSearchParams({
            key: API_KEY,
            lat: lat.toString(),
            lng: lng.toString(),
            range: range.toString(),
            count: '10',
            order: '4', // おすすめ順
            format: 'json',
        });

        const res = await fetch(`${BASE_URL}?${params}`);
        if (!res.ok) {
            console.warn('[Hotpepper] API error:', res.status);
            return [];
        }

        const data = await res.json();
        const shops = data.results?.shop || [];
        const spots = shops.map((shop, i) => convertShopToSpot(shop, i));

        cache.set(cacheKey, spots);
        return spots;
    } catch (err) {
        console.warn('[Hotpepper] Fetch failed:', err.message);
        return [];
    }
}

/**
 * Hotpepperの写真URLを高解像度版に変換
 * photo.pc.l (168px) → オリジナルサイズに書き換え
 */
function getHighResPhoto(shop) {
    // 優先順: pc.l > mobile.l
    const url = shop.photo?.pc?.l || shop.photo?.mobile?.l || null;
    if (!url) return null;

    // Hotpepperの画像URLパターン: /imgfp/XX/YY/ZZ/NNNNN/l.jpg
    // l.jpg → original.jpg で高解像度版を取得可能
    // パターン2: _l.jpg → _ll.jpg (より大きいサイズ)
    let highRes = url;

    if (url.includes('/l.jpg')) {
        highRes = url.replace('/l.jpg', '/original.jpg');
    } else if (url.includes('_l.jpg')) {
        highRes = url.replace('_l.jpg', '_ll.jpg');
    } else if (url.includes('_l.png')) {
        highRes = url.replace('_l.png', '_ll.png');
    }

    return highRes;
}

/**
 * Hotpepperのshopデータをアプリ共通スポット形式に変換
 */
function convertShopToSpot(shop, index) {
    const genre = shop.genre?.name || '飲食';
    const subGenre = shop.sub_genre?.name || genre;
    const catchText = shop.catch || shop.genre?.catch || '';
    const budgetAvg = shop.budget?.average || '';
    const budgetName = shop.budget?.name || '';

    // カテゴリ判定: カフェ・バー・スイーツ → rest、それ以外 → food
    const category = guessCategory(genre, subGenre);

    // 営業時間のパース（例: "月～日、祝日、祝前日: 11:00～23:00"）
    const openHours = parseOpenHours(shop.open);

    // mealTypeの推定（foodカテゴリのみ）
    const mealType = category === 'food' ? guessMealType(genre, subGenre, openHours) : ['cafe'];

    // タグの生成
    const tags = [genre];
    if (subGenre && subGenre !== genre) tags.push(subGenre);
    if (shop.private_room === 'あり') tags.push('個室');
    if (shop.wifi === 'あり') tags.push('Wi-Fi');
    if (shop.lunch === 'あり') tags.push('ランチ');
    if (category === 'rest') tags.push('雨OK');

    // 文脈理由テンプレートを生成
    const reasonTemplates = category === 'rest'
        ? buildRestReasonTemplates(catchText, genre)
        : buildReasonTemplates(catchText, genre, budgetAvg);
    const inviteTemplates = category === 'rest'
        ? buildRestInviteTemplates(genre)
        : buildInviteTemplates(genre, budgetAvg);

    return {
        id: `hp-${shop.id || index}`,
        name: shop.name || '不明な店舗',
        category,
        subcategory: subGenre || genre,
        lat: parseFloat(shop.lat) || null,
        lng: parseFloat(shop.lng) || null,
        address: shop.address || '',
        openHours,
        budgetRange: budgetAvg || budgetName || '不明',
        tags,
        indoorOutdoor: 'indoor',
        sourceUrl: shop.urls?.pc || null,
        photoUrl: getHighResPhoto(shop),
        travelTime: null,
        mealType,
        reasonTemplates,
        inviteTemplates,
        _hotpepper: true,
    };
}

/**
 * ジャンルからカテゴリを判定
 * カフェ・バー・スイーツ・喫茶 → rest（休憩）
 * それ以外 → food（ご飯）
 */
function guessCategory(genre, subGenre) {
    const combined = `${genre} ${subGenre}`;
    const restKeywords = ['カフェ', 'バー', 'バル', 'スイーツ', '喫茶', 'ダイニングバー', 'ワインバー', 'ケーキ', 'パンケーキ', 'スナック', 'ラウンジ'];
    for (const kw of restKeywords) {
        if (combined.includes(kw)) return 'rest';
    }
    return 'food';
}

/**
 * 営業時間テキストをパース
 */
function parseOpenHours(openText) {
    if (!openText) return { open: '10:00', close: '22:00' };

    // "11:00～23:00" のようなパターンを抽出
    const timeMatch = openText.match(/(\d{1,2}:\d{2})\s*[～〜\-]\s*(\d{1,2}:\d{2})/);
    if (timeMatch) {
        return { open: timeMatch[1], close: timeMatch[2] };
    }

    // デフォルト
    return { open: '10:00', close: '22:00' };
}

/**
 * ジャンルと営業時間からmealTypeを推定
 */
function guessMealType(genre, subGenre, openHours) {
    const types = [];
    const combined = `${genre} ${subGenre}`.toLowerCase();

    if (combined.includes('カフェ') || combined.includes('スイーツ') || combined.includes('喫茶')) {
        types.push('cafe');
    }
    if (combined.includes('ランチ') || combined.includes('定食') || combined.includes('ラーメン') || combined.includes('うどん') || combined.includes('そば')) {
        types.push('lunch');
    }

    // 営業時間からランチ/ディナーを推定
    if (openHours) {
        const openHour = parseInt(openHours.open.split(':')[0]);
        const closeHour = parseInt(openHours.close.split(':')[0]);
        if (openHour <= 14) types.push('lunch');
        if (closeHour >= 17 || closeHour <= 4) types.push('dinner');
    }

    // デフォルトでランチとディナーは入れる
    if (!types.includes('lunch')) types.push('lunch');
    if (!types.includes('dinner')) types.push('dinner');

    return [...new Set(types)];
}

/**
 * キャッチコピーから文脈理由テンプレートを生成
 */
function buildReasonTemplates(catchText, genre, budget) {
    const shortCatch = catchText.length > 30 ? catchText.slice(0, 28) + '…' : catchText;

    return {
        lunch: shortCatch || `${genre}のランチ、どう？`,
        dinner: shortCatch || `${genre}で夜ご飯。`,
        cafe: shortCatch || 'ちょっと一息。',
        default: shortCatch || `${genre}が気になる。`,
    };
}

/**
 * 誘いテンプレートを生成
 */
function buildInviteTemplates(genre, budget) {
    const budgetText = budget ? `予算${budget}。` : '';
    return {
        short: 'サクッと寄ってく？',
        medium: `${budgetText || ''}ここどう？`,
        default: '行ってみない？',
    };
}

/**
 * 休憩カテゴリ用の理由テンプレート
 */
function buildRestReasonTemplates(catchText, genre) {
    const shortCatch = catchText.length > 30 ? catchText.slice(0, 28) + '…' : catchText;
    return {
        rain: shortCatch || '雨の日は屋内で一息。',
        night: shortCatch || '夜でもくつろげる。',
        default: shortCatch || `${genre}でちょっと休憩。`,
    };
}

/**
 * 休憩カテゴリ用の誘いテンプレート
 */
function buildRestInviteTemplates(genre) {
    return {
        short: 'ちょっと座る？',
        medium: 'ゆっくりしていく？',
        default: '一息つこう。',
    };
}
