import path from "path"
import gulp from "gulp"
import webpack from "webpack-stream"
import concat from "pipe-concat"

import config from "./webpack.config"
import {camelName, setFileExt} from "../utils"

/**
@param settings: pass to webpack
@param options: {
    from: entry file absolute path,
    to: output file absolute path,
    boolean sourcemap: whether to create a sourcemap file,
    boolean minify: whether to create a minified file,
}
**/

export default function({from, to, settings, options}) {
    var outputdir = path.dirname(to)
    var filename = path.basename(to)

    settings = config(settings)
    var outputSettings = settings.output

    outputSettings.filename = outputSettings.filename || filename
    outputSettings.library = outputSettings.library || camelName(filename)

    // sourcemap
    if(options.sourcemap === "inline") {
        settings.devtool = "inline-source-map"
    }
    else if(options.sourcemap) {
        settings.devtool = "source-map"
        outputSettings.sourceMapFilename = outputSettings.sourceMapFilename || filename + ".map"
    }

    var stream1 = gulp.src(from)
        .pipe(webpack(settings))
        .pipe(gulp.dest(outputdir))

    if(!option.minify) {
        return stream1
    }

    // minify
    filename = outputSettings.filename
    filename = filename.substr(0, filename.lastIndexOf(".js")) + ".min.js"
    outputSettings.filename = filename
    outputSettings.sourceMapFilename && outputSettings.sourceMapFilename = filename + ".map"
    settings.plugins.contact([
        new optimize.UglifyJsPlugin({
            minimize: true,
        }),
    ])

    var stream2 = gulp.src(from)
        .pipe(webpack(settings))
        .pipe(gulp.dest(outputdir))

    return concat(stream1, stream2)
}
