import {gulp, fs, path, config} from "./gulp/loader"

/**
 * create tasks
 */
var dirPath = config.paths.tasks
var files = fs.readdirSync(dirPath)
files.forEach(file => {
    var filePath = path.join(dirPath, file)
    var task = path.basename(file, ".js")
    gulp.task(task, require(filePath))
})