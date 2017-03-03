import RawSource from 'webpack/lib/RawSource'

export default class {
    constructor() {}
    apply(compiler) {
        compiler.plugin('emit', (compilation, callback) => {
            let file = compilation.options.output.filename
            let assets = compilation.assets
            let asset = assets[file]
            if(!asset) {
                callback()
                return
            }
            let content = asset.source()

            // begin to modify content
            content = this.process(content, file, assets, compilation, compiler) || content

            assets[file] = new RawSource(content)
            callback()
        })
    }

    // rewrite this property when you create your own webpack plugin
    process(content, file, assets, compilation) {}
}
