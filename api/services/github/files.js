const api = require('./api')
const auth = require('./auth')
const zmk = require('../zmk')

const MODE_FILE = '100644'

class MissingRepoFile extends Error {
  constructor(path) {
    super()
    this.name = 'MissingRepoFile'
    this.path = path
    this.errors = [`Missing file ${path}`]
  }
}

async function fetchKeyboardFiles (installationId, owner, repository, shield, branch) {
  const { data: { token: installationToken } } = await auth.createInstallationToken(installationId)
  const { data: info } = await fetchFile(installationToken,owner, repository, `config/boards/shields/${shield}/info.json`, { raw: true, branch })
  const keymap = await fetchKeymap(installationToken,owner, repository, shield, branch)
  const originalCodeKeymap = await findCodeKeymap(installationToken,owner, repository,shield, branch)
  return { info, keymap, originalCodeKeymap }
}

async function fetchKeymap (installationToken,owner, repository, shield, branch) {
  try {
    const { data : keymap } = await fetchFile(installationToken,owner, repository, `config/boards/shields/${shield}/keymap.json`, { raw: true, branch })
    return keymap
  } catch (err) {
    if (err instanceof MissingRepoFile) {
      return {
        keyboard: 'unknown',
        keymap: 'unknown',
        layout: 'unknown',
        layer_names: ['default'],
        layers: [[]]
      }
    } else {
      throw err
    }
  }
}

async function fetchFile (installationToken,owner, repository, path, options = {}) {
  const { raw = false, branch = null } = options
  const url = `/repos/${owner}/${repository}/contents/${path}`
  const params = {}

  if (branch) {
    params.ref = branch
  }

  const headers = { Accept: raw ? 'application/vnd.github.v3.raw' : 'application/json' }
  try {
    return await api.request({ url, headers, params, token: installationToken })
  } catch (err) {
    if (err.response?.status === 404) {
      throw new MissingRepoFile(path)
    }
  }
}
async function fetchShields (installationToken,owner, repository, branch) {
  // Assume that the relevant files are under `config/` and not a complicated
  // directory structure, and that there are fewer than 1000 files in this path
  // (a limitation of GitHub's repo contents API).
  const { data: directory } = await fetchFile(installationToken, owner, repository, 'config/boards/shields', { branch })
  const originalCodeKeymap = directory.filter(item => item.type === 'dir');

  if (!originalCodeKeymap) {
    throw new MissingRepoFile('config/boards/shields')
  }

  return originalCodeKeymap
}
async function findCodeKeymap (installationToken,owner, repository,shield, branch) {
  // Assume that the relevant files are under `config/` and not a complicated
  // directory structure, and that there are fewer than 1000 files in this path
  // (a limitation of GitHub's repo contents API).
  const { data: directory } = await fetchFile(installationToken, owner, repository, `config/boards/shields/${shield}`, { branch })
  const originalCodeKeymap = directory.find(file => file.name.toLowerCase().endsWith('.keymap'))

  if (!originalCodeKeymap) {
    throw new MissingRepoFile('config/*.keymap')
  }

  return originalCodeKeymap
}

async function findCodeKeymapTemplate (installationToken, owner, repository,shield, branch) {
  // Assume that the relevant files are under `config/` and not a complicated
  // directory structure, and that there are fewer than 1000 files in this path
  // (a limitation of GitHub's repo contents API).
  const { data: directory } = await fetchFile(installationToken,owner, repository, `config/boards/shields/${shield}`,  { branch })
  const template = directory.find(file => file.name.toLowerCase().endsWith('.keymap.template'))

  if (template) {
    const { data: content } = await fetchFile(installationToken, owner, repository, template.path, { branch, raw: true })
    return content
  }
}

async function commitChanges (installationId,owner, repository,shield, branch, layout, keymap) {
  const { data: { token: installationToken } } = await auth.createInstallationToken(installationId)
  const template = await findCodeKeymapTemplate(installationToken,owner, repository,shield, branch)

  const generatedKeymap = zmk.generateKeymap(layout, keymap, template)

  const originalCodeKeymap = await findCodeKeymap(installationToken, owner, repository,shield,branch)
  const { data: {sha, commit} } = await api.request({ url: `/repos/${owner}/${repository}/commits/${branch}`, token: installationToken })

  const { data: { sha: newTreeSha } } = await api.request({
    url: `/repos/${owner}/${repository}/git/trees`,
    method: 'POST',
    token: installationToken,
    data: {
      base_tree: commit.tree.sha,
      tree: [
        {
          path: originalCodeKeymap.path,
          mode: MODE_FILE,
          type: 'blob',
          content: generatedKeymap.code
        },
        {
          path: 'config/keymap.json',
          mode: MODE_FILE,
          type: 'blob',
          content: generatedKeymap.json
        }
      ]
    }
  })

  const { data: { sha: newSha } } = await api.request({
    url: `/repos/${owner}/${repository}/git/commits`,
    method: 'POST',
    token: installationToken,
    data: {
      tree: newTreeSha,
      message: 'Updated keymap',
      parents: [sha]
    }
  })

  await api.request({
    url: `/repos/${owner}/${repository}/git/refs/heads/${branch}`,
    method: 'PATCH',
    token: installationToken,
    data: {
      sha: newSha
    }
  })

  return newSha
}

async function fetchFirmware (installationId,owner, repository, branch, commitId) {
  const { data: { token: installationToken } } = await auth.createInstallationToken(installationId)
 
  try {
      const { data } = await api.request({
        url: `/repos/${owner}/${repository}/actions/artifacts`,
        method: 'GET',
        token: installationToken
      });

      artifactFound = data.artifacts.find(artifact => 
        artifact.workflow_run && artifact.workflow_run.head_sha === commitId
      );

      if (artifactFound) {

        // 8. 下载Artifact
        const downloadResponse = await api.request({
          url: `/repos/${owner}/${repository}/actions/artifacts/${artifactFound.id}/zip`,
          method: 'GET',
          token: installationToken,
          responseType: 'stream' // 重要：对于文件下载
        });

        // 返回提交SHA和下载流
        return {
          status: 1,
          message: "",
          artifactDownloadStream: downloadResponse.data
        };
      }else{
        return {
          status:0,
          message:"固件生成中",
          artifactDownloadStream:null
        }
      }
     
    } catch (error) {
      console.error('Error polling artifacts:', error.message);
      // 网络错误时等待30秒后重试
      return {
          status:-1,
          message:error.message,
          artifactDownloadStream:null
        }
    }

}
module.exports = {
  MissingRepoFile,
  fetchKeyboardFiles,
  findCodeKeymap,
  commitChanges,
  fetchFirmware,
  fetchShields
}
