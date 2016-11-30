import {gulp, fs, path, args, logger, config} from "../loader"
import paserSnippet from "../utils/paserSnippet"
import isValidName from "../utils/isValidName"
import {dashlineName} from "../utils/nameConvert"

module.exports = function() {
	var arg = args.add
	var name = arg.name

	if(!isValidName(name)) {
		return
	}

	name = dashlineName(name)
	var type = arg.type || "default"
	var componentPath = path.join(config.paths.components, name)
	var snippetPath = path.join(config.paths.snippets, type)

	if(fs.existsSync(componentPath)) {
		logger().timestamp().error(`gulp error: ${name} exists, delete "components/${name}" before you add.`)
		return
	}
	else {
		fs.mkdir(componentPath)
	}

	if(type === "package") {
		return addPackage()
	}
	else if(type === "bower") {
		return addBower()
	}
	else {
		return addComponent()
	}

	function doneMsg() {
		logger().timestamp().done(`gulp success: ${name} has been completely created.`)
	}

	function addComponent() {
		return gulp.src([snippetPath + "/**/*", snippetPath + "/.*"])
			.pipe(paserSnippet({
				componentName: name,
			}))
			.pipe(gulp.dest(componentPath))
			.on("end", doneMsg)
	}

	function addPackage() {
		return gulp.src([snippetPath + "/**/*", snippetPath + "/.*"])
			.pipe(paserSnippet({
				componentName: name,
				author: arg.author || "",
			}))
			.pipe(gulp.dest(componentPath))
			.on("end", () => {
				fs.renameSync(componentPath + "/src/index.js", componentPath + "/src/" + name + ".js")
				doneMsg()
			})
	}

	function addBower() {
		return gulp.src([snippetPath + "/**/*", snippetPath + "/.*"])
			.pipe(paserSnippet({
				componentName: name,
				author: arg.author || "",
			}))
			.pipe(gulp.dest(componentPath))
			.on("end", () => {
				fs.renameSync(componentPath + "/src/js/index.js", componentPath + "/src/js/" + name + ".js")
				fs.renameSync(componentPath + "/src/style/style.scss", componentPath + "/src/style/" + name + ".scss")
				doneMsg()
			})
	}
}