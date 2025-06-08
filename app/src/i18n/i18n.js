import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 加载翻译文件
const loadResources = () => {
  const resources = {
    en: {
      translation: require('./en/common.json')
    },
    zh: {
      translation: require('./zh/common.json')
    }
  };
  return resources;
};

i18n
  .use(LanguageDetector) // 自动检测浏览器语言
  .use(initReactI18next)
  .init({
    resources: loadResources(),
    lng: 'zh', // 硬编码默认中文
    fallbackLng: 'zh', // 默认语言
    interpolation: {
      escapeValue: false // React 已经处理 XSS
    },
    detection: {
      order: ['navigator', 'cookie', 'localStorage'],
      caches: ['cookie']
    }
  });

export default i18n;