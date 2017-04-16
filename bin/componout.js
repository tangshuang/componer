#!/usr/bin/env node

import fs from 'fs'
import commander from 'commander'

import {exit, execute, log} from './utils/process'
import {readJSON, scandir, load} from './utils/file'


var argvs = process.argv
if(argvs.length <= 2) {
	execute('cpt -h')
	exit()
}

var info = readJSON(__dirname + '/../package.json')
commander
	.version(info.version)
	.usage("<task> [options]")
	.option("-v, --version", "same as `-V`")

commander
	.arguments('<cmd>')
	.action(cmd => {
		log("Not found `" + cmd + "` command, use `componer -h` to read more.", "warn")
	})

var commanders = scandir(__dirname + '/tasks')
commanders.forEach(file => {
    load(__dirname + '/tasks/' + file)(commander)
})

commander.parse(argvs)
