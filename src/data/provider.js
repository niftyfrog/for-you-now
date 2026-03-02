/**
 * DataProvider - スポットデータの取得を抽象化
 * MVPではseed.jsonから読み込み、将来はAPI差し替え可能
 */
import seedData from './seed.json';
import { getFallbackSpots } from './fallback.js';

export class SeedDataProvider {
  constructor() {
    this.spots = seedData.spots;
  }

  /**
   * カテゴリ別に候補を取得
   * @param {string} category - 'scenery' | 'food' | 'rest' | 'limited'
   * @returns {Array} スポットの配列
   */
  getCandidates(category) {
    const results = this.spots.filter(s => s.category === category);
    if (results.length === 0) {
      return getFallbackSpots(category);
    }
    return results;
  }

  /**
   * 全候補を取得
   * @returns {Array}
   */
  getAllCandidates() {
    return this.spots;
  }

  /**
   * IDでスポットを取得
   * @param {string} id
   * @returns {Object|null}
   */
  getById(id) {
    return this.spots.find(s => s.id === id) || null;
  }
}

// シングルトンインスタンス
export const dataProvider = new SeedDataProvider();
