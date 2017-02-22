import RawSource from "webpack/lib/RawSource"

export default function WebPackPluginBase(factory) {
    return class {
        constructor() {}
        apply(compiler) {
            compiler.plugin("emit", (compilation, callback) => {
                let file = compilation.options.output.filename
                let assets = compilation.assets
                let asset = assets[file]
                let content = asset.source()

                // begin to modify content
                content = factory(content, file, compilation, compiler) || content

                assets[file] = new RawSource(content)
                callback()
            })
        }
    }
}

export var WebPackPluginCMD = WebPackPluginBase((content, file, compilation) => {
    if(compilation.options.output.libraryTarget === "umd") {
        content = content
            .replace("typeof define === 'function' && define.amd", "typeof define === 'function' && define.amd && define.cmd")
            .replace('"function"==typeof define&&define.amd', '"function"==typeof define&&define.amd&&define.cmd')
    }
    return content
})
