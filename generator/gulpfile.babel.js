import "babel-polyfill"
import fs from "fs"
import path from "path"

var files = fs.readdirSync("./gulp/tasks")
files.forEach(file => {
    let filePath = path.join(__dirname, "gulp/tasks", file)
    require(filePath)
})
