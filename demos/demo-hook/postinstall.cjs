require('node:fs').writeFileSync(require('node:path').join(process.env.DEMO_MARKER_DIR || __dirname, 'POSTINSTALL-RAN.txt'),'postinstall executed');
console.log('POSTINSTALL EXECUTED');
