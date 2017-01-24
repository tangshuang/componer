import {path} from "../loader"
import {modifyStreamContent} from "./index"

function matchAll(str, reg) {
  var res = []
  var match
  while(match = reg.exec(str)) {
    res.push(match)
  }
  return res
}

export function AssetsRelativePath(entryFile, distPath) {
	return modifyStreamContent((content, filePath) => {
    var matches = matchAll(content, /url\((\S+?)\)/gi)
    var currentDir = path.dirname(filePath)

    if(matches instanceof Array) {
      matches.forEach(match => {
        let url = match[1]
        // only relative path supported
        if(url.toString().substr(0, 1) !== ".") {
          return
        }

        let file = url.replace("'", "").replace('"', "")
        let originalPath = path.resolve(currentDir, file)
        let relative = path.relative("", originalPath)
        let res = relative.replace(/\\/g, "/")
        content = content.replace(url, res)
      })
    }

		return content
	})
}
