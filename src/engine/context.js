/**
 * Context - 文脈情報を収集
 * 位置情報・天候・日没時刻を取得
 */

/**
 * 位置情報を取得（Geolocation API）
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
export function getGeolocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000, enableHighAccuracy: false }
        );
    });
}

/**
 * Open-Meteo APIから天候情報を取得
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{weather: string, temperature: number}|null>}
 */
export async function getWeather(lat, lng) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();

        const weatherCode = data.current.weather_code;
        const temperature = data.current.temperature_2m;

        return {
            weather: interpretWeatherCode(weatherCode),
            temperature,
            weatherCode,
        };
    } catch {
        return null;
    }
}

/**
 * 天候コードを解釈
 * @param {number} code - WMO weather code
 * @returns {'sunny'|'cloudy'|'rainy'|'snowy'}
 */
function interpretWeatherCode(code) {
    if (code <= 1) return 'sunny';
    if (code <= 3) return 'cloudy';
    if (code >= 51 && code <= 67) return 'rainy';
    if (code >= 71 && code <= 77) return 'snowy';
    if (code >= 80 && code <= 82) return 'rainy';
    if (code >= 95) return 'rainy';
    return 'cloudy';
}

/**
 * 日没時刻を取得（Open-Meteo API）
 * @param {number} lat
 * @param {number} lng
 * @param {Date} now
 * @returns {Promise<Date|null>}
 */
export async function getSunsetTime(lat, lng, now) {
    try {
        const dateStr = now.toISOString().slice(0, 10);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunset&timezone=Asia%2FTokyo&start_date=${dateStr}&end_date=${dateStr}`;
        const res = await fetch(url);
        if (!res.ok) return estimateSunset(now);
        const data = await res.json();

        if (data.daily && data.daily.sunset && data.daily.sunset[0]) {
            return new Date(data.daily.sunset[0]);
        }
        return estimateSunset(now);
    } catch {
        return estimateSunset(now);
    }
}

/**
 * 日没を簡易推定（東京ベース）
 * @param {Date} now
 * @returns {Date}
 */
function estimateSunset(now) {
    const month = now.getMonth(); // 0-11
    // 東京の月別おおよその日没時刻
    const sunsetHours = [16.9, 17.3, 17.8, 18.2, 18.6, 19.0, 19.0, 18.6, 18.0, 17.3, 16.8, 16.6];
    const h = sunsetHours[month];
    const sunset = new Date(now);
    sunset.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
    return sunset;
}

/**
 * 全コンテキスト情報を収集
 * @param {{lat: number, lng: number}|null} location - 位置情報（手動入力の場合あり）
 * @returns {Promise<Object>}
 */
export async function gatherContext(location) {
    const now = new Date();
    let weather = null;
    let sunsetTime = null;

    if (location) {
        // 並行で天候と日没を取得
        const [w, s] = await Promise.all([
            getWeather(location.lat, location.lng),
            getSunsetTime(location.lat, location.lng, now),
        ]);
        weather = w;
        sunsetTime = s;
    } else {
        sunsetTime = estimateSunset(now);
    }

    return {
        now,
        location,
        weather,
        sunsetTime,
    };
}
