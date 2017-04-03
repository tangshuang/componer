#!/usr/bin/env node

import fs from 'fs'
import {exit, execute, log} from './utils/process'
import {readJSON, scandir, load} from './utils/file'

import commander from 'commander'

var argvs = process.argv
if(argvs.length <= 2) {
	execute('componer -h')
	exit()
}

var info = readJSON(__dirname + '/../package.json')
commander
	.version(info.version)
	.usage("<task> [options] [name] [param...]")
	.option("-v, --version", "same as `-V`")

commander
	.arguments('<cmd>')
	.action(cmd => {
		log("Not found `" + cmd + "` command, use `componer -h` to read more.", "warn")
	})

var commanders = scandir(__dirname + '/commanders')
commanders.forEach(file => {
    load(__dirname + '/commanders/' + file)(commander)
})

commander.parse(argvs)
