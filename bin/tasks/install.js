import path from 'path'
import {log, execute} from '../utils/process'
import {exists, readJSON} from '../utils/file'
import {PackagesPicker, installPackages} from '../utils/package'

export default function(commander) {
    commander
    .command('install')
	.description('install dependencies one by one for componout')
	.option('-F, --force', 'force to install packages if exists in local')
    .option('-R, --resolve', 'install packages one by one if your computer has no enough memory.')
	.action(options => {
        let picker = PackagesPicker()
        let cwd = process.cwd()
        let bowerJson = path.join(cwd, 'bower.json')
        let npmJson = path.join(cwd, 'package.json')
        if(exists(npmJson)) {
            let info = readJSON(npmJson)
            let deps = info.dependencies
            let devdeps = info.devDependencies
            let peerdeps = info.peerDependencies
            picker.add(deps, 'npm').add(devdeps, 'npm').add(peerdeps, 'npm')
        }
        if(exists(bowerJson)) {
            // bower come first, so here bower should come behind to cover npm
            let info = readJSON(bowerJson)
            let deps = info.dependencies
            let devdeps = info.devDependencies
            picker.add(deps, 'bower').add(devdeps, 'bower')
        }

        options.cwd = cwd
        installPackages(picker.use(), options)
		log('All (dev)dependencies have been installed.', 'done')
    })
}
