import '@fortawesome/fontawesome-free/css/all.css'
import keyBy from 'lodash/keyBy'
import { useMemo, useState } from 'react'

import * as config from './config'
import './App.css';
import { DefinitionsContext } from './providers'
import { loadKeycodes } from './keycodes'
import { loadBehaviours } from './api'
import KeyboardPicker from './Pickers/KeyboardPicker';
import Spinner from './Common/Spinner';
import Keyboard from './Keyboard/Keyboard'
import GitHubLink from './GitHubLink'
import Loader from './Common/Loader'
import github from './Pickers/Github/api'
import ValidationErrors from './Pickers/Github/ValidationErrors'

import { useTranslation } from 'react-i18next';

function App() {
  const [definitions, setDefinitions] = useState(null)
  const [source, setSource] = useState(null)
  const [sourceOther, setSourceOther] = useState(null)
  const [layout, setLayout] = useState(null)
  const [keymap, setKeymap] = useState(null)
  const [editingKeymap, setEditingKeymap] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [curCommitId,setCurCommitId] = useState(null)
  const [messages,setMessages] = useState(null)
  const { i18n } = useTranslation();
  const [_, forceUpdate] = useState(); // 用于触发重新渲染
  const { t } = useTranslation() // 获取翻译函数  
  function handleCompile() {
    fetch(`${config.apiBaseUrl}/keymap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editingKeymap || keymap)
    })
  }


  const handleCommitChanges = useMemo(() => function() {
    const { repository, branch, shield } = sourceOther.github

    ;(async function () {
      setSaving(true)
      const res = await github.commitChanges(repository, branch, shield, layout, editingKeymap)
      setSaving(false)
      if(res.status==200){
        setCurCommitId(res.data.commitid)
      }else{
        setCurCommitId(null)
      }
      
      setKeymap(editingKeymap)
      setEditingKeymap(null)
    })()
  }, [
    layout,
    editingKeymap,
    sourceOther,
    setSaving,
    setFetching,
    setKeymap,
    setEditingKeymap,
    setCurCommitId
  ])


  const dismiss = useMemo(() => function () {
    setMessages(null)
  }, [])

  const handleFetchFirmware = useMemo(() => function() {
    const { repository, branch,shield } = sourceOther.github

    ;(async function () {
      setFetching(true)
      try{
        const response = await github.fetchFirmware(repository, branch, curCommitId)
        
          if(response.status==200 && !response.data.message){
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${repository}-artifact.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
          }
      }catch(err){
        setMessages("固件编译中....")
      }finally{
        setFetching(false)
      }
    })()
  }, [
    layout,
    editingKeymap,
    sourceOther,
    setSaving,
    setFetching,
    setKeymap,
    setEditingKeymap,
    setCurCommitId
  ])
  const handleKeyboardSelected = useMemo(() => function(event) {
    const { source, layout, keymap, ...other } = event

    setSource(source)
    setSourceOther(other)
    setLayout(layout)
    setKeymap(keymap)
    setEditingKeymap(null)
    setCurCommitId(null)
  }, [
    setSource,
    setSourceOther,
    setLayout,
    setKeymap,
    setEditingKeymap,
    setCurCommitId
  ])

  const initialize = useMemo(() => {
    return async function () {
      const [keycodes, behaviours] = await Promise.all([
        loadKeycodes(),
        loadBehaviours()
      ])

      keycodes.indexed = keyBy(keycodes, 'code')
      behaviours.indexed = keyBy(behaviours, 'code')

      setDefinitions({ keycodes, behaviours })
      setCurCommitId(null)
    }
  }, [setDefinitions,setCurCommitId])

  const handleUpdateKeymap = useMemo(() => function(keymap) {
    setEditingKeymap(keymap)
    setCurCommitId(null)
  }, [setEditingKeymap,setCurCommitId])

  return (
    <>
      <Loader load={initialize}>
        <KeyboardPicker onSelect={handleKeyboardSelected} />
        <div id="actions">
          {source === 'local' && (
            <button disabled={!editingKeymap} onClick={handleCompile}>
              {t("LocalSave")}
            </button>
          )}
          {source === 'github' && (
            <button
              title={t("committing message")}
              disabled={!editingKeymap}
              onClick={handleCommitChanges}
            >
              {saving ? t('Committing') : t('Commit')}
              { (saving) && <Spinner />}
            </button>
            
          )}
           {source === 'github' && (
            <button
              title={t("Download Frimware")}
              disabled={!curCommitId}
              onClick={handleFetchFirmware}
            >
              {fetching ? t("Downloading") : t("Download")}
              {(fetching) && <Spinner />}
            </button>
            
          )}

          {
            messages &&(
              <ValidationErrors
              title={t("Warning")}
              errors={[messages]}
              otherRepoOrBranchAvailable={false}
              onDismiss={dismiss}
            />
               
            )
          }
        </div>
        <DefinitionsContext.Provider value={definitions}>
          {layout && keymap && (
            <Keyboard
              layout={layout}
              keymap={editingKeymap || keymap}
              onUpdate={handleUpdateKeymap}
            />
          )}
        </DefinitionsContext.Provider>
         
      </Loader>
      <GitHubLink className="github-link" />
    </>
  );
}

export default App;
