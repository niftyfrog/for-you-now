/**
 * HIMA PUSH → For you now - Main Entry Point
 * SPA Router: Home → Suggestions → Category → Detail
 */
import './style.css';
import { renderHome } from './screens/home.js';
import { renderSuggestions } from './screens/suggestions.js';
import { renderCategory } from './screens/category.js';
import { renderDetail } from './screens/detail.js';

const app = document.getElementById('app');

// 画面状態管理
let currentScreen = 'home';
let lastContext = null;
let lastSettings = null;

// 初期レンダリング
renderHome(app, handleSearch);

/**
 * 検索実行 → 提案画面へ
 */
function handleSearch(context, settings) {
  lastContext = context;
  lastSettings = settings;
  currentScreen = 'suggestions';
  renderSuggestions(app, context, settings, handleDetail, handleBackToHome, handleCategory);
}

/**
 * カテゴリドリルダウン画面へ
 */
function handleCategory(category, context, settings) {
  currentScreen = 'category';
  renderCategory(app, category, context || lastContext, settings || lastSettings, handleDetail, handleBackToSuggestions);
}

/**
 * カード詳細画面へ
 */
function handleDetail(card) {
  currentScreen = 'detail';
  renderDetail(app, card, handleBackToSuggestions);
}

/**
 * ホームへ戻る
 */
function handleBackToHome() {
  currentScreen = 'home';
  renderHome(app, handleSearch);
}

/**
 * 提案一覧へ戻る
 */
function handleBackToSuggestions() {
  if (lastContext && lastSettings) {
    currentScreen = 'suggestions';
    renderSuggestions(app, lastContext, lastSettings, handleDetail, handleBackToHome, handleCategory);
  } else {
    handleBackToHome();
  }
}
