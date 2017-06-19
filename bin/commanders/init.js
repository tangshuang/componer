import path from 'path'
import {is, root} from '../utils/componer'
import {log, execute, prompt, exit} from '../utils/process'
import {dashName} from '../utils/convert-name'
import {scandir, readJSON, writeJSON, link, copy} from '../utils/file'

const cwd = process.cwd()
const generator = path.resolve(__dirname, '../../generator')

export default function() {
   // 1.if this directory is a componer directory, run reset
   if(is(cwd)) {
       log('Current project is ready. You can run `componer reset` to use latest componer code.', 'warn')
       return
   }

   // 2.if this is not a componer directory, break out
   if(scandir(cwd).length > 0) {
       log('Current directory is not empty.', 'error')
       return
   }

   // 3.init normally
   log('copying files...')
   copy(generator, cwd)

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

               log('install dependencies ...', 'help')
               execute(`cd "${cwd}" && npm install`)
               exit()
           })
       })
   })
}
