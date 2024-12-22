const os = require('os')
module.exports = {
    name: 'kopatych-bun',
    script: 'src/index.ts',
    interpreter: os.platform() === 'win32' ? `${os.homedir()}\\.bun\\bin\\bun.exe` : '~/.bun/bin/bun'
}
