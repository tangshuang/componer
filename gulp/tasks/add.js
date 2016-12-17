import {gulp, fs, path, logger, config, exit} from "../loader"
import {paserSnippet, isValidName, dashlineName, runTask} from "../utils"
import processArgs from "process.args"

const args = processArgs({
	n: "name",
	a: "author",
	t: "type",
})

module.exports = function() {
	var arg = args.add
	var name = arg.name

	if(!isValidName(name)) {
		exit()
	}

	name = dashlineName(name)
	var type = arg.type || "default"
	var componentPath = path.join(config.paths.components, name)
	var snippetPath = path.join(config.paths.snippets, type)

	if(fs.existsSync(componentPath)) {
		logger.error(`Error: ${name} exists, delete "components/${name}" before you add.`)
		exit()
	}
	else {
		fs.mkdir(componentPath)
	}

	return gulp.src([snippetPath + "/**/*", snippetPath + "/.*"])
		.pipe(paserSnippet({
			componentName: name,
			author: arg.author || "",
		}))
		.pipe(gulp.dest(componentPath))
		.on("end", () => {
			logger.done(`Success: ${name} has been completely created.`)
			
			if(type === "package") {
				fs.renameSync(componentPath + "/src/index.js", componentPath + "/src/" + name + ".js")
			}
			else {
				fs.renameSync(componentPath + "/src/js/index.js", componentPath + "/src/js/" + name + ".js")
				fs.renameSync(componentPath + "/src/style/index.scss", componentPath + "/src/style/" + name + ".scss")
			}
		})
}