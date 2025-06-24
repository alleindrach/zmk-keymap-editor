const REPOSITORY = 'selectedGithubRepository'
const BRANCH = 'selectedGithubBranch'
const SHIELD = 'selectedGithubShield'
export function getPersistedRepository() {
  try {
    return JSON.parse(localStorage.getItem(REPOSITORY))
  } catch {
    return null
  }
}

export function setPersistedRepository(repository) {
  localStorage.setItem(REPOSITORY, JSON.stringify(repository))
}

export function getPersistedBranch(repoId) {
  try {
    return JSON.parse(localStorage.getItem(`${BRANCH}:${repoId}`))
  } catch {
    return null
  }
}

export function setPersistedBranch(repoId, branch) {
  localStorage.setItem(`${BRANCH}:${repoId}`, JSON.stringify(branch))
}
export function getPersistedShield(repoId,branch) {
  try {
    return JSON.parse(localStorage.getItem(`${SHIELD}:${branch}:${repoId}`))
  } catch {
    return null
  }
}

export function setPersistedShield(repoId, branch,shield) {
  localStorage.setItem(`${SHIELD}:${branch}:${repoId}`, JSON.stringify(shield))
}
