import gulp from "gulp"
import fs from "fs"
import path from "path"
import logger from "process.logger"
import processArgs from "process.args"
import shell from "shelljs"
import extend from "extend"

import webpack from "../webpack.config"
import karma from "../karma.config"

const rootPath = path.resolve(__dirname, "..")
const gulpDir = "gulp"
const tasks = "tasks"
const snippets = "snippets"
const templates = "templates"
const componouts = "componouts"

const config = {
	dirs: {
		gulp: gulpDir,
		tasks,
		templates,
		snippets,
		componouts,
	},
	paths: {
		root: rootPath,
		gulp: path.join(rootPath, gulpDir),
		tasks: path.join(rootPath, gulpDir, tasks),
		templates: path.join(rootPath, gulpDir, templates),
		snippets: path.join(rootPath, gulpDir, snippets),
		componouts: path.join(rootPath, componouts),
	},
	webpack,
	karma,
}

const args = processArgs()

function exit() {
	process.exit(0)
}

function exists(file) {
	return fs.existsSync(file)
}

function read(file, charset = "utf8") {
	if(!exists(file)) {
		return false
	}
	return fs.readFileSync(file, charset)
}

function readJSON(file, charset = "utf8") {
	if(!exists(file)) {
		return false
	}
	return JSON.parse(read(file, charset))
}

function write(file, content, charset = "utf8") {
	return fs.writeFileSync(file, content, charset)
}

function writeJSON(file, json, charset = "utf8") {
	return write(file, JSON.stringify(json, null, 4), charset)
}

function execute(cmd, done, fail) {
	var result = shell.exec(cmd)
	if(result.code === 0) {
		typeof done === "function" && done()
	}
	else {
		typeof fail === "function" && fail(result.stderr)
		exit()
	}
}

function log(content, level) {
	if(process.argv.indexOf("--color") && logger[level]) {
		logger[level](content)
	}
	else {
		console.log(content)
	}
}

function clear(dir) {
	execute("cd " + dir + " && rm -rf * && rm -rf .??*")
}

export {
    gulp,
    fs,
    path,
    extend,
    logger,

    config,
    args,
    
    exit,
    exists,
    read,
    readJSON,
    write,
    writeJSON,
    execute,
    clear,
    log,
}