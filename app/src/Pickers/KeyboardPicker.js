import i18n from  '../i18n/i18n' // 必须在其他组件之前导入
import compact from 'lodash/compact'
import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as config from '../config'
import { loadLayout } from '../layout.js'
import { loadKeymap } from '../keymap.js'
import Selector from "../Common/Selector"
import GithubPicker from './Github/Picker'
import LanguagePicker from "./LanguagePicker"
import { useTranslation } from 'react-i18next' // 新增导入
const sourceChoices = compact([
  config.enableLocal ? { id: 'local', name: 'Local' } : null,
  config.enableGitHub ? { id: 'github', name: 'GitHub' } : null
])

const selectedSource = localStorage.getItem('selectedSource')
const onlySource = sourceChoices.length === 1 ? sourceChoices[0].id : null
const defaultSource = onlySource || (
  sourceChoices.find(source => source.id === selectedSource)
    ? selectedSource
    : null
)

function KeyboardPicker(props) {
  const { onSelect } = props
  const [source, setSource] = useState(defaultSource)
  const { t } = useTranslation() // 获取翻译函数
    // 国际化后的选项
  const localizedSourceChoices = useMemo(() => (
    sourceChoices.map(choice => ({
      ...choice,
      name: t(choice.id.toLowerCase()) // 使用翻译
    }))
  ), [t])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const handleKeyboardSelected = useMemo(() => function (event) {
    const { layout, keymap, ...rest } = event

    const layerNames = keymap.layer_names || keymap.layers.map((_, i) => 
      t('layer', { number: i + 1 }) // 翻译层名称
    )
    Object.assign(keymap, {
      layer_names: layerNames
    })

    onSelect({ source, layout, keymap, ...rest })
  }, [onSelect, source,t])
  const handleLanguageChange = async (lang) => {
    await i18n.changeLanguage(lang);
    console.log("language changed....");
    // forceUpdate({}); // 强制更新所有翻译内容
  };
  const fetchLocalKeyboard = useMemo(() => async function() {
    setLoading(true)
    setError(null)
    try {
        const [layout, keymap] = await Promise.all([
          loadLayout(),
          loadKeymap()
        ])

        handleKeyboardSelected({ source, layout, keymap })
      }catch (err) {
      setError(t('error', { error: err.message }))
    } finally {
      setLoading(false)
    }
  }, [source, handleKeyboardSelected,t])

  useEffect(() => {
    localStorage.setItem('selectedSource', source)
    if (source === 'local') {
      fetchLocalKeyboard()
    }
  }, [source, fetchLocalKeyboard])

  return (
    <div>
      <Selector
        id="source"
        label={t('source')} // 翻译标签
        value={source}
        choices={localizedSourceChoices} // 使用翻译后的选项
        onUpdate={value => {
          setSource(value)
          onSelect(value)
        }}
      />

      {source === 'github' && (
        <GithubPicker onSelect={handleKeyboardSelected} />
      )}
      <LanguagePicker onChange={handleLanguageChange} />
    </div>
  )
}

KeyboardPicker.propTypes = {
  onSelect: PropTypes.func.isRequired
}

export default KeyboardPicker
