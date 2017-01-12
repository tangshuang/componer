import extend from "extend"
import webpack from "./webpack.config"

export default function karma(options) {

    var defaults = {
        singleRun: true,
        port: 9000 + parseInt(Math.random() * 1000),
        frameworks: ["jasmine"],
        browsers: [],
        preprocessors: {},
        webpack: webpack({
            devtool: "inline-source-map",
        }),
        scssPreprocessor: {
            options: {
                sourceMap: true,
                includePaths: [],
            },
        },
        reporters: [],
        coverageReporter: {},
        htmlReporter: {},
        plugins: [],
    }

    // -------------------------------------------------------------------

    var settings = {}

    if(options && typeof options === "object") {
        extend(settings, defaults, options)
    }
    else {
        settings = defaults
    }

    settings.plugins = settings.plugins.concat([
        require("karma-jasmine"),
        require("karma-phantomjs-launcher"),
        require("karma-chrome-launcher"),
        require("karma-firefox-launcher"),
        require("karma-coverage"),
        require("karma-webpack"),
        require("karma-scss-preprocessor"),
        require("karma-html-reporter"),
        require("karma-sourcemap-loader"),
    ])

    settings.scssPreprocessor.options.includePaths.push("bower_components")

    return settings

}