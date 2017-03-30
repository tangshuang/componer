import fs from 'fs'
import path from 'path'
import webpackVendor from './webpack-vendor'
import webpackStream from './webpack-stream'
import {camelName} from '../utils/convert-name'

import concat from 'pipe-concat'


/**
@desc build js by webpack
@param string from: entry file absolute path
@param string to: output file absolute path
@param object options: {
    boolean sourcemap: whether to use sourcemap,
    boolean minify: whether to minify code, the minify codes are in another .min file
    array|boolean vendors: vendors to be seperated from output built file, if false, ignore all externals packages
}
@param object settings: webpack settings
@return streaming
*/

export default function(from, to, options = {}, settings  = {}) {
    var outputdir = path.dirname(to)
    var filename = path.basename(to)
    var name = path.basename(to, '.js')
    var vendors = options.vendors
    var hasVendors = Array.isArray(vendors) && vendors.length > 0
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
                if(request.indexOf('.') !== 0 || request.indexOf('/') !== 0) {
                    return callback(null, request)
                }
                callback()
            }
        ])
    }

    if(hasVendors) {
        opts.vendors = webpackVendor(vendors, outputdir + '/' + name + '.vendors.js', opts, sets)
    }
    var stream1 = webpackStream(from, to, opts, settings)
    streams.push(stream1)

    if(options.minify) {
        opts.minify = true
        if(hasVendors) {
            opts.vendors = webpackVendor(vendors, outputdir + '/' + name + '.vendors.min.js', opts, sets)
        }
        let stream2 = webpackStream(from, outputdir + '/' + name + '.min.js', opts, settings)
        streams.push(stream2)
    }

    return concat(streams)
}
