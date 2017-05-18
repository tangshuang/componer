import path from 'path'
import extend from 'extend'
import {root, check} from '../utils/componer'
import {log, prompt, exit, execute} from '../utils/process'
import {readJSON, writeJSON} from '../utils/file'

const cwd = root()
const generator = path.resolve(__dirname, '../../generator')

export default function(commander) {
    check()
    log('Reset may change componer files in your project directory.')
    prompt('Are you sure to reset? yes/No ', answer => {
        if(answer !== 'yes' && answer != 'y') exit()
        execute(`rm -rf "${cwd}/gulp"`, true)
        execute(`rm -f "${cwd}/gulpfile.babel.js"`, true)

        log('copying files...')
        execute(`cp -rf "${generator}/gulp/." "${cwd}/gulp/"`, true)
        execute(`cp -f "${generator}/gulpfile.babel.js" "${cwd}/"`, true)

        // use new package dependencies
        let pkgJson = cwd + '/package.json'
        let pkgInfo = readJSON(pkgJson)
        let newPkgInfo = readJSON(generator + '/package.json')
        extend(true, pkgInfo.dependencies, newPkgInfo.dependencies)
        extend(true, pkgInfo.devDependencies, newPkgInfo.devDependencies)
        writeJSON(pkgJson, pkgInfo)

        log('install dependencies ...', 'help')
        execute(`cd "${cwd}" && npm install`)
        exit()
    })
}
