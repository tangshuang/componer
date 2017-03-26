import fs from 'fs'
import shell from 'shelljs'

export function exists(file) {
    return fs.existsSync(file)
}

export function read(file) {
    if(!exists(file)) return
    return fs.readFileSync(file)
}

export function readJSON(file) {
    if(!exists(file)) return
	return JSON.parse(read(file).toString())
}

export function write(file, content) {
    fs.writeFileSync(file, content)
}

export function writeJSON(file, json) {
	write(file, JSON.stringify(json, null, 4))
}

export function scandir(dir) {
    if(!exists(dir)) return
	return fs.readdirSync(dir)
}

export function link(file, target) {
    if(!exists(file)) return
    fs.symlinkSync(target, file, fs.lstatSync(file).isDirectory() ? 'dir' : 'file')
}

export function remove(file) {
    if(!exists(file)) return
	fs.unlinkSync(file)
}

export function clear(dir) {
    if(!exists(dir)) return
	shell.exec(`cd "${dir}" && rm -rf * && rm -rf .??*`)
}

export function rmdir(dir) {
    if(!exists(dir)) return
	shell.exec(`rm -rf "${dir}"`)
}

export function load(file, useDefault = true) {
	if(!exists(file)) return
	var rs = require(file)
	if(typeof rs === 'object') {
		if(useDefault && rs.default) return rs.default
		else return rs
	}
	return rs
}
