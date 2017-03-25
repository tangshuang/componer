import gulp from 'gulp'
import fs from 'fs'
import path from 'path'

import processArgs from 'process.args'

export * from './utils/file'
export * from './utils/process'
export * from './utils/str-pad'
export * from './utils/convert-name'
export * from './utils/componout'

// -------------------------------------

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
//             exports
// -------------------------------------

export {
    gulp,
    fs,
    path,
    extend,

    config,
    args,
}
