const { Router } = require('express')

const {
  getOauthToken,
  getOauthUser,
  getUserToken,
  verifyUserToken,
  fetchInstallationRepos,
  fetchRepoBranches,
  fetchKeyboardFiles,
  createOauthFlowUrl,
  createOauthReturnUrl,
  commitChanges,
  fetchFirmware
} = require('../services/github')
const { createInstallationToken } = require('../services/github/auth')
const { MissingRepoFile, findCodeKeymap } = require('../services/github/files')
const { parseKeymap, validateKeymapJson, KeymapValidationError } = require('../services/zmk/keymap')
const { validateInfoJson, InfoValidationError } = require('../services/zmk/layout')

const router = Router()

const authorize = async (req, res) => {
  if (req.query.code) {
    try {
      const { data: oauth } = await getOauthToken(req.query.code)
      const { data: user } = await getOauthUser(oauth.access_token)
      const token = getUserToken(oauth, user)
      res.redirect(createOauthReturnUrl(token))
    } catch (err) {
      const message = err.response ? err.response.data : err
      console.error(message)
      res.sendStatus(500)
    }
  } else {
    console.log("createOauthFlowUrl....")
    res.redirect(createOauthFlowUrl())
  }
}

const handleError = (err, req, res, next) => {
  if (err.response && err.response.status === 401) {
    console.error('Received upstream authentication error', err.response.data)
    return res.sendStatus(401)
  } else {
    const message = err.response ? `[${err.response.status}] ${err.response.data}` : err
    console.error(message, err)
  }

  res.sendStatus(500)
}

const authenticate = (req, res, next) => {
  const header = req.headers.authorization
  const token = (header || '').split(' ')[1]

  if (!token) {
    return res.sendStatus(401)
  }

  try {
    req.user = verifyUserToken(token)
  } catch (err) {
    return res.sendStatus(401)
  }

  next()
}

const getInstallation = async (req, res, next) => {
  const { user } = req
  const { sub: username, oauth_access_token: userToken } = user

  try {
    const installationRepos = await fetchInstallationRepos(userToken)
    if (installationRepos.installations.length === 0) {
      console.log(`User ${username} does not have an active app installation.`)
    }

    res.json(installationRepos)
  } catch (err) {
    next(err)
  }
}

const getBranches = async (req, res, next) => {
  const { installationId, repository } = req.params

  try {
    const { data: { token: installationToken } } = await createInstallationToken(installationId)
    const branches = await fetchRepoBranches(installationToken, repository)

    res.json(branches)
  } catch (err) {
    next(err)
  }
}

const getKeyboardFiles = async (req, res, next) => {
  const { installationId, repository } = req.params
  const { branch } = req.query

  try {
    const { info, keymap } = await fetchKeyboardFiles(installationId, repository, branch)
    validateInfoJson(info)
    validateKeymapJson(keymap)

    res.json({
      info,
      keymap: parseKeymap(keymap)
    })
  } catch (err) {
    if (err instanceof MissingRepoFile) {
      console.error(`Validation error in ${repository} (${branch}):`, err.constructor.name, err.errors)
      return res.status(400).json({
        name: err.constructor.name,
        path: err.path,
        errors: err.errors
      })
    } else if (err instanceof InfoValidationError || err instanceof KeymapValidationError) {
      console.error(`Validation error in ${repository} (${branch}):`, err.constructor.name, err.errors)
      return res.status(400).json({
        name: err.name,
        errors: err.errors
      })
    }

    next(err)
  }
}

const updateKeyboardFiles = async (req, res, next) => {
  const { installationId, repository, branch } = req.params
  const { keymap, layout } = req.body
  let commitid; // 在try外部声明变量
  try {
    commitid = await commitChanges(installationId, repository, branch, layout, keymap)
     // 返回200状态码和commitid
    res.status(200).json({
      status: 'success',
      commitid: commitid
    });
  } catch (err) {
    return next(err)
  }

}

const downloadFirmware = async (req, res, next) => {
  const { installationId, repository, branch,commitid} = req.params

  try {
    apiRes = await fetchFirmware(installationId, repository, branch, commitid)
    if(apiRes.status >0){
        res.status(200)
        apiRes.artifactDownloadStream.pipe(res);
    }else{
        res.status(200).json({
          message: apiRes.message
        });
    }
  } catch (err) {
    return next(err)
  }

}

const receiveWebhook = (req, res) => {
  res.sendStatus(200)
}

router.get('/authorize', authorize)
router.get('/installation/:installationId/:repository/branches', authenticate, getBranches)
router.get('/installation', authenticate, getInstallation)
router.get('/keyboard-files/:installationId/:repository', authenticate, getKeyboardFiles)
router.post('/keyboard-files/:installationId/:repository/:branch', authenticate, updateKeyboardFiles)
router.post('/download-firmware/:installationId/:repository/:branch/:commitid', authenticate, downloadFirmware)
router.post('/webhook', receiveWebhook)
router.use(handleError)

module.exports = router
