const api = require('./index')
const config = require('./config')

api.listen(config.PORT)
console.log('listening on', config.PORT)
