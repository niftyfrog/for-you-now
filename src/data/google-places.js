/**
 * Google Places API クライアント
 * 全カテゴリのスポットを高品質写真付きで取得
 */

const API_KEY = 'AIzaSyBSFIOuveTGF1OpVumew_6No_XSuQxhLME';
const BASE_URL = '/api/google-places';

// カテゴリ → Google Places type マッピング
const CATEGORY_TYPES = {
    scenery: ['park', 'tourist_attraction', 'natural_feature'],
    food: ['restaurant'],
    rest: ['cafe', 'spa', 'bar'],
    limited: ['museum', 'art_gallery', 'amusement_park'],
};

// Google Places type → アプリカテゴリ逆引き
const TYPE_TO_CATEGORY = {
    park: 'scenery',
    tourist_attraction: 'scenery',
    natural_feature: 'scenery',
    point_of_interest: 'scenery',
    restaurant: 'food',
    meal_delivery: 'food',
    meal_takeaway: 'food',
    cafe: 'rest',
    spa: 'rest',
    bar: 'rest',
    night_club: 'rest',
    museum: 'limited',
    art_gallery: 'limited',
    amusement_park: 'limited',
    stadium: 'limited',
    movie_theater: 'limited',
};

// 距離→半径変換 (km → meters, max 50000)
function distanceToRadius(maxDistanceKm) {
    return Math.min(maxDistanceKm * 1000, 50000);
}

/**
 * Google Places Photo URL を生成
 * Place Photos APIは画像を直接返すのでCORS不要
 */
function getPhotoUrl(photoReference, maxWidth = 800) {
    if (!photoReference) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${API_KEY}`;
}

/**
 * 周辺スポットを検索（Nearby Search）
 */
async function nearbySearch(lat, lng, radius, type) {
    const url = `${BASE_URL}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&language=ja&key=${API_KEY}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.warn(`[GooglePlaces] API status: ${data.status}`, data.error_message);
        }

        return data.results || [];
    } catch (err) {
        console.warn('[GooglePlaces] Nearby search failed:', err);
        return [];
    }
}

/**
 * 全カテゴリの周辺スポットを一括検索
 */
export async function searchAllNearby(lat, lng, maxDistanceKm = 5) {
    const radius = distanceToRadius(maxDistanceKm);
    const allTypes = new Set();

    // 全カテゴリのtypeを集める（重複排除）
    Object.values(CATEGORY_TYPES).forEach(types => {
        types.forEach(t => allTypes.add(t));
    });

    // 並列でAPI呼び出し（最大3並列に制限）
    const typeArray = [...allTypes];
    const results = [];

    // 3つずつバッチ処理
    for (let i = 0; i < typeArray.length; i += 3) {
        const batch = typeArray.slice(i, i + 3);
        const batchResults = await Promise.all(
            batch.map(type => nearbySearch(lat, lng, radius, type))
        );
        batchResults.forEach(r => results.push(...r));
    }

    // 重複排除（place_idベース）
    const seen = new Set();
    const unique = results.filter(place => {
        if (seen.has(place.place_id)) return false;
        seen.add(place.place_id);
        return true;
    });

    // アプリ形式に変換
    return unique.map((place, i) => convertPlaceToSpot(place, i, { lat, lng }));
}

/**
 * 特定カテゴリの周辺スポットを検索
 */
export async function searchNearbyByCategory(lat, lng, category, maxDistanceKm = 5) {
    const radius = distanceToRadius(maxDistanceKm);
    const types = CATEGORY_TYPES[category] || ['point_of_interest'];

    const results = await Promise.all(
        types.map(type => nearbySearch(lat, lng, radius, type))
    );

    const allResults = results.flat();

    // 重複排除
    const seen = new Set();
    const unique = allResults.filter(place => {
        if (seen.has(place.place_id)) return false;
        seen.add(place.place_id);
        return true;
    });

    return unique.map((place, i) => convertPlaceToSpot(place, i, { lat, lng }));
}

/**
 * Google Placeデータ → アプリ共通スポット形式に変換
 */
function convertPlaceToSpot(place, index, userLocation) {
    // カテゴリ判定
    const category = detectCategory(place.types || []);

    // 写真URL（高品質）
    const photoRef = place.photos?.[0]?.photo_reference || null;
    const photoUrl = getPhotoUrl(photoRef, 800);

    // 距離計算
    const dist = userLocation
        ? haversineDistance(userLocation.lat, userLocation.lng, place.geometry.location.lat, place.geometry.location.lng)
        : null;

    const walkMinutes = dist ? Math.round(dist / 80) : null; // 80m/分
    const travelInfo = walkMinutes ? `徒歩${walkMinutes}分` : null;

    // 価格レベル → テキスト
    const priceText = place.price_level !== undefined
        ? ['無料', '〜1000円', '1000〜3000円', '3000〜5000円', '5000円〜'][place.price_level] || '不明'
        : '不明';

    // タグ生成
    const tags = [];
    if (place.rating) tags.push(`⭐ ${place.rating}`);
    if (place.user_ratings_total) tags.push(`${place.user_ratings_total}件の口コミ`);
    if (place.opening_hours?.open_now) tags.push('営業中');
    (place.types || []).slice(0, 3).forEach(t => {
        const jp = TYPE_JAPANESE[t];
        if (jp) tags.push(jp);
    });

    return {
        id: `gp-${place.place_id || index}`,
        name: place.name || '不明なスポット',
        category,
        subcategory: getSubcategoryText(place.types),
        lat: place.geometry?.location?.lat || null,
        lng: place.geometry?.location?.lng || null,
        address: place.vicinity || place.formatted_address || '',
        openHours: place.opening_hours ? {
            open: place.opening_hours.open_now ? '営業中' : '営業時間外',
            close: ''
        } : null,
        budgetRange: priceText,
        tags,
        indoorOutdoor: detectIndoorOutdoor(place.types),
        sourceUrl: null,
        photoUrl,
        travelInfo,
        travelTime: walkMinutes,
        _googlePlaces: true,
        // テンプレート用
        emoji: getCategoryEmoji(category),
        label: getCategoryLabel(category),
        line1: travelInfo || '',
        line2: place.name ? `${place.name}で${getCategoryAction(category)}` : '',
        line3: getInviteText(category),
    };
}

// --- ヘルパー関数 ---

function detectCategory(types) {
    for (const type of types) {
        if (TYPE_TO_CATEGORY[type]) return TYPE_TO_CATEGORY[type];
    }
    return 'scenery'; // デフォルト
}

function detectIndoorOutdoor(types) {
    const outdoor = ['park', 'natural_feature', 'campground'];
    return types.some(t => outdoor.includes(t)) ? 'outdoor' : 'indoor';
}

const TYPE_JAPANESE = {
    park: '公園',
    tourist_attraction: '観光名所',
    natural_feature: '自然',
    restaurant: 'レストラン',
    cafe: 'カフェ',
    bar: 'バー',
    spa: 'スパ',
    museum: '美術館・博物館',
    art_gallery: 'ギャラリー',
    amusement_park: '遊園地',
    movie_theater: '映画館',
    night_club: 'ナイトクラブ',
    shopping_mall: 'ショッピング',
    book_store: '本屋',
    library: '図書館',
};

function getSubcategoryText(types) {
    for (const t of types || []) {
        if (TYPE_JAPANESE[t]) return TYPE_JAPANESE[t];
    }
    return 'スポット';
}

function getCategoryEmoji(cat) {
    return { scenery: '🌿', food: '🍽', rest: '☕', limited: '📅' }[cat] || '📍';
}

function getCategoryLabel(cat) {
    return { scenery: '自然', food: '食事', rest: '休憩', limited: '限定' }[cat] || 'スポット';
}

function getCategoryAction(cat) {
    return {
        scenery: 'リフレッシュ',
        food: '美味しいご飯',
        rest: 'ひと休み',
        limited: '特別な体験',
    }[cat] || 'すごす';
}

function getInviteText(cat) {
    const options = {
        scenery: ['散歩でもどう？', '外の空気を吸おう', 'ちょっと歩いてみない？'],
        food: ['お腹空いてない？', '一緒に食べよう', 'ちょっと寄ってみない？'],
        rest: ['ちょっと座る？', '一息つこう', 'リラックスしない？'],
        limited: ['行ってみない？', '今だけのチャンス！', '気になるかも？'],
    };
    const arr = options[cat] || options.scenery;
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Haversine距離（メートル）
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
