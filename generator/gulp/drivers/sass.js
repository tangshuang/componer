import path from 'path'
import concat from 'pipe-concat'
import extend from 'extend'

import sassStream from './sass-stream'

/**
@desc build scss to css by sass
@param string from: entry file absolute path
@param string to: output file absolute path
@param object options: {
    boolean sourcemap: whether to use sourcemap,
    boolean minify: whether to minify code, the minify codes are in another .min file
    array|boolean vendors:
        if array, seperated them from output built file to be in a single bundle file,
        if true, use dependencies as vendors,
        if false, ignore all externals packages, ignore means without vendors bundle,
    boolean hashfile: whether to use hashed filename for output files
    string cwd: absolute path of json files path, for example: componer.json
}
@param object settings: webpack settings
@return streaming
**/
export default function(from, to, options = {}, settings = {}) {
    var outputdir = path.dirname(to)
    var name = path.basename(to, '.js')
    var vendors = options.vendors
    var hasVendors = () => Array.isArray(vendors) && vendors.length > 0
    var cwd = options.cwd
    var streams = []

    var opts = {
        minify: false,
        sourcemap: options.sourcemap,
        hashfile: options.hashfile,
    }

    // if vendors is false, all of vendors will not be included in output code
    if(vendors === false || vendors === null) {
        opts.vendors = {
            enable: -1,
            modules: true,
        }
    }
    // if true, use all dependencies as vendors
    else if(vendors === true) {
        let bowerJson = path.join(cwd, 'bower.json')
        let pkgJson = path.join(cwd, 'package.json')
        let getDeps = function(pkgfile) {
            if(!exists(pkgfile)) {
                return []
            }
            let info = readJSON(pkgfile)
            return Object.keys(info.dependencies).concat(Object.keys(info.devDependencies))
        }
        vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
    }

    if(hasVendors()) {
        opts.vendors = {
            enable: 1,
            modules: vendors,
        }
        streams.push(sassStream(from, outputdir + '/' + name + '.vendors.css', extend(true, {}, opts), settings))
        opts.vendors.enable = -1
    }

    var stream1 = sassStream(from, to, extend(true, {}, opts), settings)
    streams.push(stream1)

    if(options.minify) {
        opts.minify = true
        if(hasVendors()) {
            opts.vendors.enable = -1
            streams.push(sassStream(from, outputdir + '/' + name + '.vendors.min.css', extend(true, {}, opts), settings))
            opts.vendors.enable = -1
        }
        var stream2 = sassStream(from, outputdir + '/' + name + '.min.css', opts, settings)
        streams.push(stream2)
    }

    return concat(streams)
}
