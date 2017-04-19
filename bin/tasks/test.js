import gulp from 'gulp'
import karma from 'gulp-karma-runner'
import jasmine from 'gulp-jasmine-node'
import path from 'path'
import extend from 'extend'
import {log} from '../utils/process'
import {exists, readJSON, readJSONTMPL, getFileExt, mkdir, writeJSON} from '../utils/file'
import karmaConfig from '../drivers/karma.config'
import {webpack as extendSettings} from '../extend-config'

const cwd = process.cwd()
const jsonfile = path.join(cwd, 'componer.json')

export default function(commander) {
    commander
    .command('test')
	.description('link local componout as package')
    .option('-D, --debug', 'whether to use browser to debug code')
	.option('-b, --browser [browser]', 'which browser to use select one from [PhantomJS|Chrome|Firefox]')
	.action(options => {
        if(!exists(jsonfile)) {
            log('There is no componer.json in current directory.', 'error')
            return
        }

        let name = readJSON(jsonfile).name
        let info = readJSONTMPL(jsonfile, {
            name,
            path: cwd,
        })
        let settings = info.test
        if(!settings) {
            log(name + ' test option in componer.json not found.', 'error')
            return
        }

        let entryfile = settings.entry && settings.entry.from ? path.join(cwd, settings.entry.from) : false
        if(!exists(entryfile)) {
            log(name + ' test entry file not found.', 'error')
            return
        }

        /**
         * if it is a npm package, run test with jasmine-node
         */
        if(settings.browsers === 'Terminal') {
            return gulp.src(entryfile).pipe(jasmine({
                timeout: 10000,
                includeStackTrace: false,
                color: process.argv.indexOf('--color')
            }))
        }


        /**
         * if it is normal package can be run in browser
         */

        let reportersDir = settings.reporters
        if(!reportersDir) {
            log(name + 'test.reporters option is not correct in your componer.json.', 'error')
            return
        }

        let reportersPath = path.join(cwd, reportersDir)
        if(!exists(reportersPath)) {
            mkdir(reportersPath)
        }

        let preprocessors = {}
        preprocessors[cwd + '/**/*.js'] = ['webpack', 'sourcemap']
        preprocessors[cwd + '/**/*.scss'] = ['scss']

        let karmaSettings = {
                singleRun: !options.debug || !settings.debug,
                browsers: options.browser ? [options.browser] : settings.browsers,
                preprocessors: preprocessors,
                coverageReporter: {
                    reporters: [
                        {
                            type: 'html',
                            dir: reportersPath,
                        },
                    ],
                },
                htmlReporter: {
                    outputDir: reportersPath,
                    reportName: name,
                },
                webpack: extend(true, {}, extendSettings, settings.entry.settings)
            }

        let entryfiles = [entryfile]


        // if use PhantomJS to test, it do not support new functions directly, use babal-polyfill to fix
        // in fact, lower version of Chrome or Firefox are not support to. however, developer should make sure to use higher version of this browsers
        let launchers = karmaSettings.browsers
        if(launchers.indexOf('PhantomJS') > -1 || launchers.indexOf('IE') > -1 || launchers.indexOf('Safari') > -1) {
            entryfiles.unshift(path.resolve(__dirname, '../../node_modules/core-js/index.js'))
            preprocessors[path.resolve(__dirname, '../../node_modules/core-js/**/*.js')] = ['webpack']
        }

        return gulp.src(entryfiles)
            .pipe(karma.server(karmaConfig(karmaSettings)))
            .on('end', () => {
                log('Reporters ware created in componouts/' + name + '/' + reportersDir, 'help')
                exit()
            })

    })
}
