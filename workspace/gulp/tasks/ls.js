import {gulp, fs, config, log, logger} from "../loader"
import {getComponouts, strPadRight} from "../utils"

gulp.task("ls", () => {
	var componoutsPath = config.paths.componouts
	var componouts = getComponouts()

	log(strPadRight(`======================= You have ${componouts.length} componouts: ==============`, '=', 70), "help")
	
	logger.put(strPadRight("name", " ", 15)).put("\t" + strPadRight("version", " ", 10)).put("\ttype").print()

	log("----------------------------------------------------------------------")

	componouts.forEach(item => {
		logger.put(strPadRight(item.name, " ", 15), {color: "cyan"}).put("\t" + strPadRight(item.version, " ", 10)).put("\t" + item.type).print()
	})
	
	log("======================================================================", "help")
})