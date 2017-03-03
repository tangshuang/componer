import path from 'path'
import md5file from 'md5-file'
import fs from 'fs'
import GulpBuffer from './gulp-buffer'

function matchAll(str, reg) {
  var res = []
  var match
  while(match = reg.exec(str)) {
    res.push(match)
  }
  return res
}

export default function(options) {
    return GulpBuffer((content, chunk, context) => {
        if(path.extname(chunk.path) !== '.css') {
            return content
        }
        let matches = matchAll(content, /url\((\S+?)\)/gi)
        if(matches instanceof Array) {
            matches.forEach(match => {
                let url = match[1].toString()
                // only relative path supported, absolute path will be ignore
                if(url.substr(0, 1) === '/' || url.indexOf('http') === 0) {
                  return
                }
                // clear ' or  '
                let file = url.replace('"', '').replace("'", '')
                let filetruepath = path.resolve(path.dirname(chunk.path), file)

                // if there is no such file, ignore
                if(!fs.existsSync(filetruepath)) return

                let filehash = md5file.sync(filetruepath).substr(8, 16)
                let filename = filehash + path.extname(filetruepath)
                let filecontent = fs.readFileSync(filetruepath)

                let newChunk = chunk.clone()
                newChunk.contents = new Buffer(filecontent)
                newChunk.path = path.resolve(path.dirname(chunk.path), options && options.resolve ? options.resolve : '', filename)

                context.push(newChunk)

                let reg = new RegExp(url, 'g')
                content = content.replace(reg, (options && options.resolve ? options.resolve + '/' : '') + filename)
            })
            return content
        }
    })
}
