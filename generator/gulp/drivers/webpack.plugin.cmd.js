import WebpackPluginApply from "./webpack.plugin.apply"

export default function WebpackSupportCmd() {}
WebpackSupportCmd.prototype.apply = WebpackPluginApply((content, file, compilation) => {
    if(compilation.options.output.libraryTarget === "umd") {
        content = content
            .replace("typeof define === 'function' && define.amd", "typeof define === 'function' && define.amd && define.cmd")
            .replace('"function"==typeof define&&define.amd', '"function"==typeof define&&define.amd&&define.cmd')
    }
    return content
})
