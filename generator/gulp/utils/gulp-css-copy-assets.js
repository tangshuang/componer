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
    return GulpBuffer((content, file, context) => {
        if(path.extname(file.path) !== '.css' || path.extname(path.basename(file.path, '.css')) === '.min') {
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
                let fileurl = url.replace('"', '').replace("'", '')

                // if there is no such file, ignore
                let srcdirs = [path.dirname(file.path)]
                if(options && Array.isArray(options.srcdirs)) {
                    srcdirs = [...srcdirs, ...options.srcdirs]
                }

                let filetruepath

                for(let dir of srcdirs) {
                    let truepath = path.resolve(dir, fileurl)
                    if(fs.existsSync(truepath)) {
                        filetruepath = truepath
                        break
                    }
                }

                if(!filetruepath) return

                // process
                let filehash = md5file.sync(filetruepath).substr(8, 16)
                let filename = filehash + path.extname(filetruepath)
                let filecontent = fs.readFileSync(filetruepath)

                let newfile = file.clone()
                newfile.contents = new Buffer(filecontent)
                newfile.path = path.resolve(path.dirname(file.path), options && options.resolve ? options.resolve : '', filename)

                context.push(newfile)

                let reg = new RegExp(url, 'g')
                content = content.replace(reg, (options && options.resolve ? options.resolve + '/' : '') + filename)
            })
            return content
        }
    })
}
