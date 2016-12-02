import gulp from "gulp"
import fs from "fs"
import path from "path"
import logger from "process.logger"
import processArgs from "process.args"
import webpack from "../webpack.config"

const rootPath = path.resolve(__dirname, "..")
const gulpDir = path.basename(__dirname)
const componentsDir = "components"
const snippetsDir = "snippets"
const tasksDir = "tasks"

const args = processArgs({
	n: "name",
	a: "author",
	t: "type",
})
const config = {
	dirs: {
		gulp: gulpDir,
		tasks: tasksDir,
		snippets: snippetsDir,
		components: componentsDir,
	},
	paths: {
		root: rootPath,
		gulp: path.join(rootPath, gulpDir),
		tasks: path.join(rootPath, gulpDir, tasksDir),
		snippets: path.join(rootPath, gulpDir, snippetsDir),
		components: path.join(rootPath, componentsDir),
	},
	webpack,
}

export {
    gulp,
    fs,
    path,
    args,
    logger,
    config,
}
