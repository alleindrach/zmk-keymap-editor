const process = require('process')
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env' 
  : '.env.development';

require('dotenv').config({ path: envFile });
const PORT = process.env.PORT || 8080
const ENABLE_LOCAL_SERVER =  process.env.ENABLE_LOCAL_SERVER
const ENABLE_DEV_SERVER = process.env.ENABLE_DEV_SERVER
const ENABLE_GITHUB = process.env.ENABLE_GITHUB
const GITHUB_APP_NAME = process.env.GITHUB_APP_NAME
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY
const GITHUB_APP_ID = process.env.GITHUB_APP_ID
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const GITHUB_OAUTH_CALLBACK_URL = process.env.GITHUB_OAUTH_CALLBACK_URL
const APP_BASE_URL = process.env.APP_BASE_URL

module.exports = {
  PORT,
  ENABLE_DEV_SERVER,
  ENABLE_GITHUB,
  GITHUB_APP_NAME,
  GITHUB_APP_PRIVATE_KEY,
  GITHUB_APP_ID,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_OAUTH_CALLBACK_URL,
  APP_BASE_URL,
  ENABLE_LOCAL_SERVER
}
