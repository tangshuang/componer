import RawSource from "webpack/lib/RawSource"

export function WebpackSupportCmdInUmd() {}

WebpackSupportCmdInUmd.prototype.apply = function(compiler) {

  compiler.plugin("emit", function(compilation, callback) {

    if(compilation.options.output.libraryTarget !== "umd") {
      return
    }

    var outputfile = compilation.options.output.filename
    var assets = compilation.assets
    var keys = Object.keys(assets) 
    
    keys.forEach(key => {
      if(outputfile !== key) {
        return
      }

      let asset = assets[key]
      let content = asset.source()

      content = content.replace("typeof define === 'function' && define.amd", "typeof define === 'function' && define.amd && define.cmd")
        .replace('"function"==typeof define&&define.amd', '"function"==typeof define&&define.amd&&define.cmd')
      
      assets[key] = new RawSource(content)
    })

    callback()

  })

}