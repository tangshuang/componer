import {gulp, fs, config, log, execute, exit, exists, args} from "../loader"
import {hasComponout, dashlineName} from "../utils"

gulp.task("remove", () => {
	var arg = args.remove
	var name = dashlineName(arg.name)
	var rootPath = config.paths.root

	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	if(exists(`${rootPath}/bower_components/${name}`)) {
		execute(`cd ${rootPath} && bower unlink ${name}`)
	}

	if(exists(`${rootPath}/node_modules/${name}`)) {
		execute(`cd ${rootPath} && npm unlink ${name}`)
	}

	execute(`cd ${rootPath} && cd componouts && rm -rf ${name}`, () => {
		log("Done! " + name + " has been deleted.", "done")
	})

})

gulp.task("rm", ["remove"])