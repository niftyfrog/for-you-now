/**
 * DataProvider - スポットデータの取得を抽象化
 * seed.json（静的）+ Hotpepper API + Google Places API（動的）を統合
 */
import seedData from './seed.json';
import { getFallbackSpots } from './fallback.js';
import { searchNearbyRestaurants } from './hotpepper.js';
import { searchNearbyByCategory, searchAllNearby } from './google-places.js';

export class DataProvider {
  constructor() {
    this.spots = seedData.spots;
    this._hotpepperCache = null;
    this._googleCache = {};
    this._lastLocation = null;
  }

  /**
   * カテゴリ別に候補を取得
   * 全カテゴリでGoogle Places APIから動的取得、food/restはHotpepperも併用
   */
  async getCandidates(category, location = null, maxDistance = 5) {
    if (!location) {
      const results = this.spots.filter(s => s.category === category);
      return results.length > 0 ? results : getFallbackSpots(category);
    }

    // Google Places + (food/rest は Hotpepper も) + seed
    const apiResults = await this._getApiResults(category, location, maxDistance);
    const seedResults = this.spots.filter(s => s.category === category);
    const combined = [...apiResults, ...seedResults];

    if (combined.length === 0) {
      return getFallbackSpots(category);
    }

    // 重複排除（名前ベース）
    const seen = new Set();
    return combined.filter(s => {
      const key = s.name.replace(/\s/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * API結果をまとめて取得（Google Places + Hotpepper）
   */
  async _getApiResults(category, location, maxDistance) {
    const results = [];

    // Google Places（全カテゴリ対応）
    const googleResults = await this._getGoogleResults(category, location, maxDistance);
    results.push(...googleResults);

    // Hotpepper（food / rest のみ）
    if (category === 'food' || category === 'rest') {
      const hpResults = await this._getHotpepperResults(location, maxDistance);
      const hpForCategory = hpResults.filter(s => s.category === category);
      results.push(...hpForCategory);
    }

    return results;
  }

  /**
   * Google Places APIからスポットを取得（カテゴリ別キャッシュ）
   */
  async _getGoogleResults(category, location, maxDistance) {
    const cacheKey = `${category}-${location.lat.toFixed(3)}-${location.lng.toFixed(3)}`;
    if (this._googleCache[cacheKey]) {
      return this._googleCache[cacheKey];
    }

    try {
      const results = await searchNearbyByCategory(location.lat, location.lng, category, maxDistance);
      this._googleCache[cacheKey] = results;
      return results;
    } catch (err) {
      console.warn('[DataProvider] Google Places fetch failed:', err);
      return [];
    }
  }

  /**
   * Hotpepper APIから飲食店を取得（キャッシュあり）
   */
  async _getHotpepperResults(location, maxDistance) {
    if (this._hotpepperCache && this._lastLocation) {
      const latDiff = Math.abs(location.lat - this._lastLocation.lat);
      const lngDiff = Math.abs(location.lng - this._lastLocation.lng);
      if (latDiff < 0.005 && lngDiff < 0.005) {
        return this._hotpepperCache;
      }
    }

    try {
      const results = await searchNearbyRestaurants(location.lat, location.lng, maxDistance);
      this._hotpepperCache = results;
      this._lastLocation = { ...location };
      return results;
    } catch (err) {
      console.warn('[DataProvider] Hotpepper fetch failed:', err);
      return [];
    }
  }

  getAllCandidates() {
    return this.spots;
  }

  getById(id) {
    return this.spots.find(s => s.id === id) || null;
  }
}

export const dataProvider = new DataProvider();
