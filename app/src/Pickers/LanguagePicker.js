
import { useCallback,useEffect, useRef ,useState} from 'react';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import Selector from "../Common/Selector";
import './LanguagePicker.css'; // 新增样式文件

const languageChoices = [
  { id: 'zh', name: '中文' },
  { id: 'en', name: 'English' }
];

function LanguagePicker({ onChange }) {
  // 默认中文，优先读取 localStorage 保存的值
  const [currentLanguage, setCurrentLanguage] = useState(() => (
    localStorage.getItem('selectedLanguage') || 'zh'
  ));
  const prevLanguageRef = useRef(currentLanguage);
  // 防抖通知父组件
  const debouncedOnChange = useRef(
    debounce((lng) => onChange(lng), 300)
  ).current;

  useEffect(() => {
    if (prevLanguageRef.current !== currentLanguage) {
      debouncedOnChange(currentLanguage);
      prevLanguageRef.current = currentLanguage;
    }
    return () => debouncedOnChange.cancel();
  }, [currentLanguage, debouncedOnChange]);


  const handleLanguageChange = useCallback((newLanguage) => {
    localStorage.setItem('selectedLanguage', newLanguage);
    setCurrentLanguage(newLanguage);
    onChange(newLanguage);
  }, [onChange]);

//   // 初始化时通知父组件当前语言
//   useEffect(() => {
//     onChange(currentLanguage);
//   }, [currentLanguage, onChange]);

  return (
    <div className="language-picker-container">
      <Selector
        id="language"
        label="Language/语言"
        value={currentLanguage}
        choices={languageChoices}
        onUpdate={handleLanguageChange}
        className="language-selector"
      />
    </div>
  );
}

LanguagePicker.propTypes = {
  onChange: PropTypes.func.isRequired
};

export default LanguagePicker;
