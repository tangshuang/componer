import path from 'path'
import {is, root} from '../utils/componer'
import {log, execute, prompt, exit} from '../utils/process'
import {dashName} from '../../generator/gulp/utils/convert-name'
import {scandir, readJSON, writeJSON} from '../../generator/gulp/utils/file'

const cwd = process.cwd()
const generator = path.resolve(__dirname, '../../generator')
const yarn = path.resolve(__dirname, '../../node_modules/.bin/yarn')

export default function(commander) {
    let update = info => {
        // update .componerrc
        let componerInfo = readJSON(cwd + '/.componerrc')
        componerInfo.project.name = info.name
        componerInfo.project.version = info.version
        componerInfo.project.author = info.author
        componerInfo.project.registry = info.registry
        writeJSON(cwd + '/.componerrc', componerInfo)
        // update package.json
        let pkgInfo = readJSON(cwd + '/package.json')
        pkgInfo.name = info.name
        pkgInfo.author = info.author
        pkgInfo.version = info.version
        writeJSON(cwd + '/package.json', pkgInfo)
    }
    let confirm = () => {
        let cwd = root()
        let dirname = path.basename(cwd)
        let info = {}

        prompt('What is your current project name? (default: ' + dirname + ') ', answer => {
            let project = !answer || answer === '' ? dirname : answer
            info.name = dashName(project)

            prompt('What is your current project version? (default: 0.0.1) ', answer => {
                let version = !answer || answer === '' ? '0.0.1' : answer
                info.version = version

                prompt('What is your project author name? (default: componer) ', answer => {
                    let author = !answer || answer === '' ? 'componer' : answer
                    info.author = dashName(author)

                    update(info)
                    log('install dependencies ...', 'help')
                    execute(`cd "${cwd}" && "${yarn}" install`)
                    exit()
                })
            })
        })
    }

    commander.command('init')
   .description('create a componer workflow frame instance')
   .action(() => {
       // if this directory is a componer directory, just modify files
       if(is(cwd)) {
           confirm()
           return
       }

       if(scandir(cwd).length > 0) {
           log('Current directory is not empty.', 'error')
           return
       }

       log('copying files...')
       execute(`cp -rf "${generator}/." "${cwd}/"`, true)
       execute(`cd "${cwd}" && mkdir componouts`, true)
       confirm()
   })
}
