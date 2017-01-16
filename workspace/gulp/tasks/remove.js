import {gulp, prompt, args, log, exists, exit, execute, config} from "../loader"
import {dashlineName, hasComponout} from "../utils"

function removeComponout(arg) {
	var name = dashlineName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	var rootPath = config.paths.root

	prompt("Are you sure to remove " + name + " componout? yes/No  ", choice => {
		if(choice.toLowerCase() === "yes") {
			if(exists(`${rootPath}/bower_components/${name}`)) {
				execute(`cd ${rootPath} && bower unlink ${name}`)
			}

			if(exists(`${rootPath}/node_modules/${name}`)) {
				execute(`cd ${rootPath} && npm unlink ${name}`)
			}

			execute(`cd ${rootPath} && cd componouts && rm -rf ${name}`, () => {
				log("Done! " + name + " has been deleted.", "done")
			})

			exit()
		}
	})
}

gulp.task("remove", () => {
	var arg = args.remove
	removeComponout(arg)
})
gulp.task("rm", () => {
	var arg = args.rm
	removeComponout(arg)
})