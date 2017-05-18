#!/usr/bin/env node

import fs from 'fs'
import commander from 'commander'

import {exit, execute, log} from './utils/process'
import {exists, readJSON, scandir, load} from './utils/file'
import {fixname, check, config, root} from '../utils/componer'
import {dashName} from '../utils/convert-name'


const argvs = process.argv
const info = readJSON(__dirname + '/../package.json')
const gulp = path.resolve(__dirname, '../node_modules/.bin/gulp')
const cwd = process.cwd()
const rootPath = root()


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
	.action(cmd => {
		log("Not found `" + cmd + "` command, use `componer -h` to read more.", "warn")
	})

commander
	.command('init')
	.description('create a componer project')
	.action(load('./commanders/init'))

commander
	.command('reset')
	.description('reset componer and curent project componer program')
	.action(load('./commanders/reset'))

commander
	.command("clone [name]")
	.description("clone a componout from github.com/componer")
	.option("-u, --url [url]", "use your own registry url")
	.action(load('./commanders/clone'))

commander
	.command('link [name]')
	.description('link local componout as package')
	.option('-F, --force', 'force use bower/npm link to symbolic link')
	.action(load('./commanders/link'))

commander
	.command('remove <name>')
	.alias('rm')
	.description('remove a componout from componouts directory')
	.action(load('./commanders/remove'))

// ===================================================================

commander
	.command('list')
	.alias('ls')
	.description('list all componouts')
	.action(() => {
		check()
		execute(`cd "${rootPath}" && "${gulp}" list`)
	})

commander
	.command('install [pkg] [to] [name]')
	.description('install a pacakge to a componout')
	.option('-D, --dev', 'save to .json devDependencies (default dependencies)')
	.option('-F, --force', 'force to install packages no matter exists in local')
	.action((pkg, to, name, options) => {
		if(name === undefined && to === undefined && pkg === undefined && exists(cwd + '/componer.json')) {
			load('./tasks/install')(options)
			return
		}
		load('./commanders/install')(pkg, to, name, options)
	})

commander
	.command('add [name]')
	.description('create a componout')
	.option('-t, --template [template]', 'template of componout')
	.option('-a, --author [author]', 'author of componout')
	.action((name, options) => {
		if(name === undefined && exists(cwd + '/componer.json')) {
			load('./tasks/add')()
			return
		}

		name = dashName(name)
		name = fixname(name)
		check()

		let configs = config()
		let template = options.template || configs.defaults.template
		let author = options.author || configs.project.author

		if(!template || template === '') {
			log('You must input a template name, use `-h` to read more.', 'error')
			return
		}
		if(!author) {
			log('Componout author needed, use `-h` to read more.', 'error')
			return
		}

		if(!exists(`${rootPath}/gulp/templates/${template}`)) {
			log('This template is not available.', 'error')
			return
		}

		execute(`cd "${rootPath}" && "${gulp}" add --name=${name} --template=${template} --author=${author}`)
	})

commander
	.command('build [name]')
	.description('build a componout')
	.action(name => {
		if(name === undefined && exists(cwd + '/componer.json')) {
			load('./task/build')()
			return
		}

		if(name === undefined) {
			check()
			execute(`cd "${rootPath}" && "${gulp}" build`)
			return
		}

		name = dashName(name)
		name = fixname(name)
		check(name)

		execute(`cd "${rootPath}" && "${gulp}" build --name=${name}`)
	})

commander
	.command('preview [name]')
	.description('preview a componout')
	.option('-p, --port [port]', 'use custom port')
	.action((name, options) => {
		if(name === undefined && exists(cwd + '/componer.json')) {
			load('./task/preview')()
			return
		}

		if(name === undefined) {
			log('You must give a componout name.', 'warn')
			return
		}

		name = dashName(name)
		name = fixname(name)
		check(name)

		let cmd = `cd "${rootPath}" && "${gulp}" preview --name=${name}`
		if(options.port) cmd += ` --port=${options.port}`
		execute(cmd)
	})

commander
	.command('test [name]')
	.description('test a componout')
	.option('-D, --debug', 'whether to use browser to debug code')
	.option('-b, --browser [browser]', 'which browser to use select one from [PhantomJS|Chrome|Firefox]')
	.action((name, options) => {
		if(name === undefined && exists(cwd + '/componer.json')) {
			load('./task/test')(options)
			return
		}

		let cmd = `cd "${rootPath}" && "${gulp}" test`

		if(name === undefined) {
			check()
		}
		else {
			name = dashName(name)
			name = fixname(name)
			check(name)

			cmd += ` --name=${name}`
			if(options.debug) {
				cmd += ' --debug'
			}
		}

		if(options.browser) {
			cmd += ` --browser=${options.browser}`
		}

		execute(cmd)
	})

commander
	.command('watch [name]')
	.description('watch a componout to build it automaticly when code change')
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd "${rootPath}" && "${gulp}" watch`)
		}
		else {
			name = dashName(name)
			name = fixname(name)
			check(name)
			execute(`cd "${rootPath}" && "${gulp}" watch --name=${name}`)
		}
	})



commander.parse(argvs)
