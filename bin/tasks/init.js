import path from 'path'
import {exists, scandir, readJSON, writeJSON, rename} from '../utils/file'
import {log, execute, prompt, exit} from '../utils/process'
import {camelName, dashName, spaceName} from '../utils/convert-name'

import gulp from 'gulp'
import bufferify from 'gulp-bufferify'

const cwd = process.cwd()
const generator = path.resolve(__dirname, '../../generator')

export default function(commander) {
    commander.command('init')
    .description('create a componout')
    .action(() => {
        if(scandir(cwd).length > 0) {
            log('Current directory is not empty.', 'error')
            return
        }

        let dirname = path.basename(cwd)
        let info = {}
        let create = info => {
            let name = info.name
            let version = info.version
            let type = info.type
            let author = info.author

            let template = path.join(generator, 'gulp/templates', type)
            if(!exists(template)) {
                log('Type ' + type + ' not found.', 'error')
                return
            }

            return gulp.src(template + '/**/*')
                .pipe(bufferify(content => {
                    let parsers = {
                        componoutName: name,
                        authorName: author,
                    }
                    let keys = Object.keys(parsers)
                    keys.forEach(key => {
                        let value = parsers[key]
                        content = content
                            .replace((new RegExp('{{' + camelName(key) + '}}','g')), camelName(value))
                            .replace((new RegExp('{{' + camelName(key, true) + '}}','g')), camelName(value, true))
                            .replace((new RegExp('{{' + dashName(key) + '}}','g')), dashName(value))
                            .replace((new RegExp('{{' + dashName(key, true) + '}}','g')), dashName(value, true))
                            .replace((new RegExp('{{' + spaceName(key) + '}}','g')), spaceName(value))
                            .replace((new RegExp('{{' + spaceName(key, true) + '}}', 'g')), spaceName(value, true))
                    })

            		return content
            	}))
                .pipe(gulp.dest(cwd))
                .on('end', () => {
                    let jsonfile = path.join(cwd, 'componer.json')
                    let json = readJSON(jsonfile)
                    json.type = type
                    json.version = version
                    writeJSON(jsonfile, json)
                })
        }

        prompt('What is name of componout? (default: ' + dirname + ') ', answer => {
            let name = !answer || answer === '' ? dirname : answer
            info.name = dashName(name)

            prompt('What is the version of componout? (default: 0.0.1) ', answer => {
                let version = !answer || answer === '' ? '0.0.1' : answer
                info.version = version

                prompt('What is the type of componout? (select from: component, npm and app, default: component) ', answer => {
                    let type = !answer || answer === '' ? 'component' : answer
                    info.type = type

                    prompt('What is your registry author name? (default: componer) ', answer => {
                        let author = !answer || answer === '' ? 'componer' : answer
                        info.author = dashName(author)

                        create(info).on('end', () => {
                            rename(cwd + '/src/index.js', cwd + '/src/' + name + '.js')
                			rename(cwd + '/src/script/index.js', cwd + '/src/script/' + name + '.js')
                			rename(cwd + '/src/style/index.scss', cwd + '/src/style/' + name + '.scss')

                			rename(cwd + '/test/index.js', cwd + '/test/' + name + '.js')
                			rename(cwd + '/test/specs/index.js', cwd + '/test/specs/' + name + '.js')

                			rename(cwd + '/preview/index.js', cwd + '/preview/' + name + '.js')
                			rename(cwd + '/preview/index.scss', cwd + '/preview/' + name + '.scss')

                            log('Done! Componout has been created. Please run `cpot install` to install dependencies.', 'done')
                            exit()
                        })
                    })
                })
            })
        })
    })
}
