import fs from 'fs'
import shell from 'shelljs'

export function exists(file) {
    return fs.existsSync(file)
}

export function isFile(file) {
	if(!exists(file)) return
	return fs.lstatSync(file).isFile()
}

export function isDir(dir) {
	if(!exists(dir)) return
	return fs.lstatSync(dir).isDirectory()
}

export function isSymLink(file) {
	if(!exists(file)) return
	return fs.lstatSync(file).isSymbolicLink()
}

export function read(file) {
    if(!exists(file)) return
    return fs.readFileSync(file)
}

export function readJSON(file) {
    if(!exists(file)) return
	return JSON.parse(read(file).toString())
}

export function readTMPL(file, parsers) {
	if(!exists(file)) return
	var content = read(file)
	content = content.toString()
	var keys = Object.keys(parsers)
	keys.forEach(key => {
		let value = parsers[key]
		let reg = new RegExp('\\\[' + key + '\\\]', 'g')
		content = content.replace(reg, value)
	})
	return content
}

export function readJSONTMPL(file, parsers) {
	if(!exists(file)) return
	return JSON.parse(readTMPL(file, parsers))
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

export function link(from, to) {
    if(!exists(from)) return
    execute(`ln -s "${from}" "${to}"`)
}

export function remove(file) {
    if(!exists(file)) return
	shell.exec(`rm -rf "${file}"`)
}

export function clear(dir) {
    if(!exists(dir)) return
	shell.exec(`cd "${dir}" && rm -rf * && rm -rf .??*`)
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
