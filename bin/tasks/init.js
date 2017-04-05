import path from 'path'
import {exists, scandir, readJSON, writeJSON} from '../utils/file'
import {log, execute, prompt, exit} from '../utils/process'
import {camel, dash, separate} from '../utils/convert'

import gulp from 'gulp'
import bufferify from 'gulp-bufferify'

export default function(commander) {
    commander.command('init')
    .description('create a componout')
    .action(() => {
        let cwd = process.cwd()

        if(scandir(cwd).length > 0) {
            log('Current directory is not empty.', 'error')
            return
        }

        let generator = path.resolve(__dirname, '../../generator')
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
                            .replace((new RegExp('{{' + camel(key) + '}}','g')), camel(value))
                            .replace((new RegExp('{{' + camel(key, true) + '}}','g')), camel(value, true))
                            .replace((new RegExp('{{' + dash(key) + '}}','g')), dash(value))
                            .replace((new RegExp('{{' + dash(key, true) + '}}','g')), dash(value, true))
                            .replace((new RegExp('{{' + separate(key) + '}}','g')), separate(value))
                            .replace((new RegExp('{{' + separate(key, true) + '}}', 'g')), separate(value, true))
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
            info.name = dash(name)

            prompt('What is the version of componout? (default: 0.0.1) ', answer => {
                let version = !answer || answer === '' ? '0.0.1' : answer
                info.version = version

                prompt('What is the type of componout? (select from: component, npm and app, default: component) ', answer => {
                    let type = !answer || answer === '' ? 'component' : answer
                    info.type = type

                    prompt('What is your registry author name? (default: componer) ', answer => {
                        let author = !answer || answer === '' ? 'componer' : answer
                        info.author = dash(author)

                        create(info).on('end', exit)
                    })
                })
            })
        })
    })
}
