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

export function AssetsRelativePath(root) {
	return modifyStreamContent((content, filePath) => {
    var matches = matchAll(content, /url\((\S+?)\)/gi)
    if(matches instanceof Array) {
      matches.forEach(match => {
        let url = match[1].toString()
        // only relative path supported, absolute path will be ignore
        if(url.substr(0, 1) === "/" || url.indexOf("http") === 0) {
          return
        }

        let file = url.replace("'", "").replace('"', "")
        let res = root + file
        content = content.replace(url, res)
      })
    }

		return content
	})
}
