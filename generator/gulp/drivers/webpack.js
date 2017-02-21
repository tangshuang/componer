import webpack from "webpack"
import config from "./webpack.config"

/**
@param settings: pass to webpack
@param options: {
    boolean sourcemap: whether to create a sourcemap file,
    boolean minify: whether to create a minified file,
}
**/

export default function(settings, options) {
    /**
     * create stream
     */
    var stream = new Stream();
	stream.setMaxListeners(0);
	stream.writable = stream.readable = true;

    var count = options.minify ? 2 : 1
    var endemit = function() {
        count --
        if(count == 0) stream.emit("end")
    }
    var run = function(settings) {
        webpack(settings, (err, stats) => {
            if (err || stats.hasErrors()) {
                console.log("webpack error", err.details)
            }
            endemit()
        })
    }

    /**
     * run webpack
     */
    settings = config(settings)
    var filename = settings.output.filename
    if(options.sourcemap) {
        settings.devtool = options.sourcemap === "inline" ? "inline-source-map" : "source-map"
    }

    run(settings)

    if(option.minify) {
        filename = filename.substr(0, filename.lastIndexOf(".js")) + ".min.js"
        settings.output.filename = filename

        if(options.sourcemap) {
            let sourcemapfile = settings.output.sourceMapFilename
            sourcemapfile = sourcemapfile.substr(0, sourcemapfile.lastIndexOf(".js.map")) + ".min.js.map"
            settings.output.sourceMapFilename = sourcemapfile
        }

        settings.plugins.contact([
            new optimize.UglifyJsPlugin({
                minimize: true,
            }),
        ])

        run(settings)
    }

    return stream
}
