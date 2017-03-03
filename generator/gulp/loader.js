import gulp from 'gulp'
import fs from 'fs'
import path from 'path'
import logger from 'process.logger'
import processArgs from 'process.args'
import shell from 'shelljs'
import extend from 'extend'
import requireload from 'require-reload'

const args = processArgs()

// -------------------------------------
//             paths
// -------------------------------------

const rootPath = path.resolve(__dirname, '..')
const gulpDir = 'gulp'
const tasks = 'tasks'
const snippets = 'snippets'
const templates = 'templates'
const componouts = 'componouts'
const drivers = 'drivers'

const config = {
	dirs: {
		gulp: gulpDir,
		tasks,
		templates,
		snippets,
		componouts,
		drivers,
	},
	paths: {
		root: rootPath,
		gulp: path.join(rootPath, gulpDir),
		tasks: path.join(rootPath, gulpDir, tasks),
		templates: path.join(rootPath, gulpDir, templates),
		snippets: path.join(rootPath, gulpDir, snippets),
		componouts: path.join(rootPath, componouts),
		drivers: path.join(rootPath, gulpDir, drivers),
	},
}

// -------------------------------------
//             functions
// -------------------------------------

/**
 * process relative functions
 */

function exit() {
	process.exit(0)
}

function execute(cmd, done, fail) {
	var result = shell.exec(cmd)
	if(result.code === 0) {
		if(typeof done === 'function') done()
	}
	else {
		if(typeof fail === 'function') fail(result.stderr)
		exit()
	}
}

function log(content, level) {
	if(process.argv.indexOf('--color') && logger[level]) {
		logger[level](content)
	}
	else {
		console.log(content)
	}
}

/**
 * file relative functions
 */

function exists(file) {
	return fs.existsSync(file)
}

function read(file, charset = 'utf8') {
	if(!exists(file)) return
	return fs.readFileSync(file, charset)
}

function readJSON(file, charset = 'utf8') {
	if(!exists(file)) return
	return JSON.parse(read(file, charset))
}

function write(file, content, charset = 'utf8') {
	fs.writeFile(file, content, charset)
}

function writeJSON(file, json, charset = 'utf8') {
	write(file, JSON.stringify(json, null, 4), charset)
}

function scandir(dir) {
	if(!exists(dir)) return
	return fs.readdirSync(dir)
}

function clear(dir) {
	if(!exists(dir)) return
	execute('cd ' + dir + ' && rm -rf * && rm -rf .??*')
}

function mkdir(dir) {
	if(exists(dir)) return
	fs.mkdir(dir)
}

function rename(file, newfile) {
	if(!exists(file)) return
	fs.rename(file, newfile)
}

function load(file, useDefault = true) {
	if(!exists(file)) return
	var rs = requireload(file)
	if(typeof rs === 'object') {
		if(useDefault && rs.default) return rs.default
		else return rs
	}
	return rs
}

// -------------------------------------
//             exports
// -------------------------------------

export {
    gulp,
    fs,
    path,
    extend,

    config,
    args,

    exists,
    read,
	write,
    readJSON,
    writeJSON,
	mkdir,
	scandir,
	clear,
	rename,
	load,

    execute,
    log,
	exit,
}
