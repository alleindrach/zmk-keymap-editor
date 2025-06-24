import find from 'lodash/find'
import map from 'lodash/map'
import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import github from './api'
import * as storage from './storage'
import ValidationErrors from './ValidationErrors'

import IconButton from '../../Common/IconButton'
import Selector from '../../Common/Selector'
import Spinner from '../../Common/Spinner'
import { useTranslation } from 'react-i18next' // 新增导入
function Login() {
  const { t } = useTranslation() // 获取翻译函数
  return (
    <IconButton
      collection="brands"
      icon="github"
      text={t("Login with GitHub")}
      onClick={() => github.beginLoginFlow()}
    />
  )
}

function Install() {
  const { t } = useTranslation() // 获取翻译函数
  return (
    <IconButton
      collection="brands"
      icon="github"
      text={t("Add Repository")}
      onClick={() => github.beginInstallAppFlow()}
    />
  )
}

function GithubPicker(props) {
  const { t } = useTranslation() // 获取翻译函数
  const [state, setState] = useState({
    initialized: false,
    selectedRepoId: null,
    selectedBranchName: null,
    selectedShieldName: null,
    branches: [],
    shields: [],
    loadingShields: false,
    loadingBranches: false,
    loadingKeyboard: false,
    loadError: null,
    loadWarnings: null
  })

  const { initialized, branches,shields, selectedRepoId, selectedBranchName,selectedShieldName } = state
  const { loadingBranches, loadingShields,loadingKeyboard, loadError, loadWarnings } = state

  const { onSelect } = props

  const clearSelection = useMemo(() => function () {
    setState(state => ({
      ...state,
      selectedBranchName: null,
      selectedShieldName: null,
      loadError: null,
      loadWarnings: null
    }))
  }, [setState])

  const lintKeyboard = useMemo(() => function ({ layout }) {
    const noKeyHasPosition = layout.every(key => (
      key.row === undefined &&
      key.col === undefined
    ))

    if (noKeyHasPosition) {
      setState(state => ({ ...state, loadWarnings: [
        'Layout in info.json has no row/col definitions. Generated keymap files will not be nicely formatted.'
      ]}))
    }
  }, [setState])

  const loadKeyboard = useMemo(() => async function () {
    const available = github.repositories
    const repository = find(available, { id: selectedRepoId })?.full_name
    const branch = selectedBranchName
    const shield = selectedShieldName

    setState(state => ({ ...state, loadingKeyboard: true, loadError: null }))

    const response = await github.fetchLayoutAndKeymap(repository, branch,shield)

    setState(state => ({ ...state, loadingKeyboard: false }))
    lintKeyboard(response)

    onSelect({
      github: { repository, branch,shield },
      ...response
    })
  }, [
    selectedRepoId,
    selectedBranchName,
    selectedShieldName,
    setState,
    lintKeyboard,
    onSelect
  ])

  const fetchShields = useMemo(() => async function(repository, branch) {
    setState(state => ({ ...state, loadingShields: true }))
    try {
      const shields = await github.fetchShields(repository, branch)
      setState(state => ({ 
        ...state, 
        shields,
        loadingShields: false,
        selectedShieldName: shields.length > 0 ? shields[0].name : null
      }))

      const available = map(shields, 'name')
      const previousShield = storage.getPersistedShield(selectedRepoId,selectedBranchName)
      const onlyShield = shields.length === 1 ? shields[0].name : null

      for (let shield of [onlyShield, previousShield]) {
        if (available.includes(shield)) {
          setState(state => ({ ...state, selectedShieldName: shield }))
          break
        }
      }
    } catch (error) {
      setState(state => ({ 
        ...state, 
        loadingShields: false,
        loadError: error
      }))
    }
  }, [setState,selectedBranchName,selectedRepoId])

  useEffect(() => {
    github.init().then(() => {
      const persistedRepoId = storage.getPersistedRepository()
      const repositories = github.repositories || []
      let selectedRepoId

      if (find(repositories, { id: persistedRepoId })) {
        selectedRepoId = persistedRepoId
      } else if (repositories.length > 0) {
        selectedRepoId = repositories[0].id
      }

      setState(state => ({
        ...state,
        initialized: true,
        selectedRepoId
      }))
    })
  }, [])

  useEffect(() => {
    github.on('authentication-failed', () => {
      github.beginLoginFlow()
    })
  }, [])

  useEffect(() => {
    github.on('repo-validation-error', err => {
      setState(state => ({
        ...state,
        loadError: err,
        loadingKeyboard: false
      }))
    })
  }, [])

  useEffect(() => {
    if (!selectedRepoId) {
      return
    }

    storage.setPersistedRepository(selectedRepoId)

    ;(async function() {
      setState(state => ({ ...state, loadingBranches: true }))

      const repository = find(github.repositories, { id: selectedRepoId })
      const branches = await github.fetchRepoBranches(repository)

      setState(state => ({ 
        ...state, 
        branches, 
        loadingBranches: false,
        shields: [],
        selectedShieldName: null
      }))

      const available = map(branches, 'name')
      const defaultBranch = repository.default_branch
      const previousBranch = storage.getPersistedBranch(selectedRepoId)
      const onlyBranch = branches.length === 1 ? branches[0].name : null

      for (let branch of [onlyBranch, previousBranch, defaultBranch]) {
        if (available.includes(branch)) {
          setState(state => ({ ...state, selectedBranchName: branch }))
          break
        }
      }
    })()
  }, [selectedRepoId])

  // useEffect(() => {
  //   if (!selectedRepoId) {
  //     return
  //   }

  //   storage.setPersistedRepository(selectedRepoId)

  //   ;(async function() {
  //     setState(state => ({ ...state, loadingBranches: true }))

  //     const repository = find(github.repositories, { id: selectedRepoId })
  //     const branches = await github.fetchRepoBranches(repository)

  //     setState(state => ({ ...state, branches, loadingBranches: false }))

  //     const available = map(branches, 'name')
  //     const defaultBranch = repository.default_branch
  //     const previousBranch = storage.getPersistedBranch(selectedRepoId)
  //     const onlyBranch = branches.length === 1 ? branches[0].name : null

  //     for (let branch of [onlyBranch, previousBranch, defaultBranch]) {
  //       if (available.includes(branch)) {
  //         setState(state => ({ ...state, selectedBranchName: branch }))
  //         break
  //       }
  //     }
  //   })()
  // }, [selectedRepoId])


  useEffect(() => {
    if (!selectedRepoId || !selectedBranchName) {
      return
    }

    storage.setPersistedBranch(selectedRepoId, selectedBranchName)
    const repository = find(github.repositories, { id: selectedRepoId })?.full_name
    fetchShields(repository, selectedBranchName)
  }, [selectedRepoId, selectedBranchName, fetchShields])

  useEffect(() => {
    if (!selectedRepoId || !selectedBranchName || !selectedShieldName) {
      return
    }
    storage.setPersistedShield(selectedRepoId, selectedBranchName,selectedShieldName)
    loadKeyboard()
  }, [selectedRepoId, selectedBranchName, selectedShieldName, loadKeyboard])

  if (!initialized) {
    return null
  }

  if (!github.isGitHubAuthorized()) return <Login />
  if (!github.isAppInstalled()) return <Install />

  const repositoryChoices = github.repositories.map(repo => ({
    id: repo.id,
    name: repo.full_name
  }))

  const branchChoices = branches.map(branch => ({
    id: branch.name,
    name: branch.name
  }))

  const shieldChoices = shields.map(shield => ({
    id: shield.name,
    name: shield.name
  }))


  return (
    <>
      <Selector
        id="repo"
        label={t("Repository")}
        value={selectedRepoId}
        choices={repositoryChoices}
        onUpdate={id => setState(state => ({
          ...state,
          selectedRepoId: id,
          selectedBranchName: null,
          selectedShieldName: null
        }))}
      />

      {loadingBranches ? (
        <Spinner />
      ) : branches.length && (
        <Selector
          id="branch"
          label={t("Branch")}
          value={selectedBranchName}
          choices={branchChoices}
          onUpdate={name => setState(state => ({
            ...state,
            selectedBranchName: name,
            selectedShieldName: null
          }))}
        />
      )}
      { loadingShields ? (
        <Spinner />
      ) : shields.length > 0 && (
        <Selector
          id="shield"
          label={t("Shield")}
          value={selectedShieldName}
          choices={shieldChoices}
          onUpdate={name => setState(state => ({
            ...state,
            selectedShieldName: name
          }))}
        />
      )}

      {loadingKeyboard && <Spinner />}

      {loadError && (
        <ValidationErrors
          title={loadError.name}
          errors={loadError.errors}
          otherRepoOrBranchAvailable={
            repositoryChoices.length > 1
            || branchChoices.length > 0
          }
          onDismiss={clearSelection}
        />
      )}
      {loadWarnings && (
        <ValidationErrors
          title={t("Warning")}
          errors={loadWarnings}
          onDismiss={() => setState(state => ({ ...state, loadWarnings: null }))}
        />
      )}

     {selectedShieldName && !loadingKeyboard && (
        <IconButton icon="sync" onClick={loadKeyboard} />
      )}
    </>
  )
}

GithubPicker.propTypes = {
  onSelect: PropTypes.func.isRequired
}

export default GithubPicker
