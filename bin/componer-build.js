#!/usr/bin/env node

import path from 'path'
import {exit, log} from './libs/process'
import {exists, readJSONTMPL, getFileExt} from './libs/file'
import webpack from './drivers/webpack'
import sass from './drivers/sass'

import commander from 'commander'

commander.arguments('<cmd>').action(factory)
commander.parse(process.argv)

function factory(cmd) {
    var cwd = process.cwd()
    var jsonfile = path.join(cwd, 'componer.json')

    if(!exists(jsonfile)) {
        log('There is no componer.json in current directory.', 'error')
        exit()
    }

    var info = readJSONTMPL(jsonfile, {
        'path': cwd,
    })
    var items = info.build

    if(!items) {
        log('Build option is not found in componer.json.', 'error')
        exit()
    }

    items.forEach(item => {
        let from = path.join(cwd, item.from)
        let to = path.join(cwd, item.to)
        let ext = getFileExt(item.from)
        if(ext === '.js') {
            webpack(from, to, item.options, item.settings)
        }
        else if(ext === '.scss') {
            sass(from, to, item.options, item.settings)
        }
    })

    log('Build complete!', 'done')
}
