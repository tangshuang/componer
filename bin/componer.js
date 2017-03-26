#!/usr/bin/env node

import fs from 'fs'
import {exit, execute, log} from './libs/process'
import {scandir, load} from './libs/file'

import commander from 'commander'

var argvs = process.argv
if(argvs.length <= 2) {
	execute('componer -h')
	exit()
}

commander
	.version(info.version)
	.usage("<task> [options] [name] [param...]")
	.option("-v, --version", "same as `-V`")

commander
	.arguments('<cmd>')
	.action((cmd, options) => {
		log("Not found `" + cmd + "` command, use `componer -h` to read more.", "warn")
	})

var commanders = scandir('./commanders')
commanders.forEach(file => {
    load('./commanders/' + file)(commander)
})

commander.parse(argvs)
