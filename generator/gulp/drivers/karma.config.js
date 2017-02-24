import extend from "extend"
import webpack from "./webpack.config"

export default function(settings) {
    var defaults = {
        singleRun: true,
        port: 9000 + parseInt(Math.random() * 1000),
        frameworks: ["jasmine"],
        browsers: ["PhantomJS"],
        preprocessors: {},
        reporters: ["verbose", "coverage", "html"],
        coverageReporter: {
            reporters: [],
        },
        htmlReporter: {
            outputDir: "",
            reportName: "",
            urlFriendlyName: true,
        },
        webpack: webpack({
            module: {
                preLoaders: [
                    {
                        test: /\.js$/,
                        loader: "isparta",
                        exclude: /node_modules|bower_components/,
                    },
                ],
            },
            devtool: "inline-source-map",
        }),
        scssPreprocessor: {
            options: {
                sourceMap: true,
                includePaths: [
                    "bower_components",
                ],
            },
        },
        plugins: [],
    }

    settings = extend(true, defaults, settings)
    settings.coverageReporter.reporters.push({
        type: "text",
    })
    settings.plugins = settings.plugins.concat([
        require("karma-jasmine"),
        require("karma-phantomjs-launcher"),
        require("karma-chrome-launcher"),
        require("karma-firefox-launcher"),
        require("karma-webpack"),
        require("karma-scss-preprocessor"),
        require("karma-sourcemap-loader"),
        require("karma-coverage"),
        require("karma-html-reporter"),
        require("karma-verbose-reporter"),
    ])

    // if debug in browser, do not create reporters
    if(!settings.singleRun) {
        delete settings.reporters
        delete settings.coverageReporter
        delete settings.htmlReporter
        delete settings.webpack.module.preLoaders
    }

    return settings
}
