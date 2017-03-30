import {root, check} from '../utils/componer'
import {log, prompt, exit, execute} from '../utils/process'
import {readJSON, writeJSON} from '../utils/file'
import path from 'path'

export default function(commander) {
    let cwd = root()
    let generator = path.resolve(__dirname, '../../generator')

    commander.command("reset")
	.description("reset componer and curent project componer program")
    .action(() => {
        check()
        log("Reset may change componer files in your project directory.")
        prompt('Are you sure to reset? yes/No ', answer => {
            if(answer !== 'yes') exit()
            execute('rm -rf "' + cwd + '/gulp"', true)
            execute('rm -f "' + cwd + '/gulpfile.babel.js"', true)
            execute('cp -rf "' + generator + '/gulp/." "' + cwd + '/gulp/"', true)
            execute('cp -f "' + generator + '/gulpfile.babel.js" "' + cwd + '/"', true)

            // use new package dependencies
            let pkgJson = cwd + "/package.json"
            let pkgInfo = readJSON(pkgJson)
            let newPkgInfo = readJSON(generator + "/package.json")
            pkgInfo.dependencies = newPkgInfo.dependencies
            pkgInfo.devDependencies = newPkgInfo.devDependencies
            writeJSON(pkgJson, pkgInfo)

            log("npm install...", 'help')
            execute(`cd "${cwd}" && npm install`)
            exit()
        })
    })
}
