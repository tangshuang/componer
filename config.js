var path = require("path")

var rootPath = __dirname
var gulpDir = "gulp"
var snippetsDir = "snippets"
var tasksDir = "tasks"
var workDir = "compouts"

var config = {
	dirs: {
		gulp: gulpDir,
		tasks: tasksDir,
		snippets: snippetsDir,
		work: workDir,
	},
	paths: {
		root: rootPath,
		gulp: path.join(rootPath, gulpDir),
		tasks: path.join(rootPath, gulpDir, tasksDir),
		snippets: path.join(rootPath, gulpDir, snippetsDir),
		work: path.join(rootPath, workDir),
	},
}

module.exports = config