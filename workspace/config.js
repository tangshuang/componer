import webpack from "./webpack.config"
import karma from "./karma.config"

const rootPath = __dirname
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

export default config