import fs from 'fs'
import path from 'path'
import concat from 'pipe-concat'
import extend from 'extend'

import webpackVendor from './webpack-vendor'
import webpackStream from './webpack-stream'
import {camelName} from '../utils/convert-name'


/**
@desc build js by webpack
@param string from: entry file absolute path
@param string to: output file absolute path
@param object options: {
    boolean sourcemap: whether to use sourcemap,
    boolean minify: whether to minify code, the minify codes are in another .min file
    array|boolean vendors:
        if array, seperated them from output built file to be in a single bundle file,
        if true, use dependencies as vendors,
        if false, ignore all externals packages, ignore means without vendors bundle,
    string cwd: absolute path of json files path, for example: componer.json
}
@param object settings: webpack settings
@return streaming
*/

export default function(from, to, options = {}, settings  = {}) {
    var outputdir = path.dirname(to)
    var filename = path.basename(to)
    var name = path.basename(to, '.js')
    var vendors = options.vendors
    var hasVendors = () => Array.isArray(vendors) && vendors.length > 0
    var cwd = options.cwd
    var streams = []

    var opts = {
        minify: false,
        sourcemap: options.sourcemap,
    }
    var sets = {
        name: camelName(name, true) + 'Vendors',
    }

    // if vendors is false, all of vendors will not be included in output code
    if(vendors === false || vendors === null) {
        let externals = settings.externals || []
        settings.externals = externals.concat([
            (context, request, callback) => {
                if(request !== from && request.indexOf('./') === -1) { // not relative path module
                    callback(null, request)
                    return
                }
                callback()
            }
        ])
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
        opts.vendors = webpackVendor(vendors, outputdir + '/' + name + '.vendors.js', opts, sets)
    }
    let stream1 = webpackStream(from, to, opts, settings)
    streams.push(stream1)

    if(options.minify) {
        let opts2 = extend(true, {}, opts)
        opts2.minify = true
        if(hasVendors()) {
            opts2.vendors = webpackVendor(vendors, outputdir + '/' + name + '.vendors.min.js', opts2, sets)
        }
        let stream2 = webpackStream(from, outputdir + '/' + name + '.min.js', opts2, settings)
        streams.push(stream2)
    }

    return concat(streams)
}
