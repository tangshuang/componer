import path from 'path'
import {log, execute} from '../utils/process'
import {exists, readJSON} from '../utils/file'
import {PackagesPicker, PackagesInstaller} from '../utils/package'

const cwd = process.cwd()

export default function(commander) {
    commander
    .command('install')
	.description('install dependencies one by one for componout')
	.option('-F, --force', 'force to install packages if exists in local')
	.action(options => {
        let picker = PackagesPicker()
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

        let pkgs = picker.use()
        let installer = PackagesInstaller({
            cwd,
            force: options.force,
        })
        if(pkgs.npm.length > 0) installer.npmInstall(pkgs.npm)
        if(pkgs.bower.length > 0) installer.bowerInstall(pkgs.bower)
		log('All (dev)dependencies have been installed.', 'done')
    })
}
