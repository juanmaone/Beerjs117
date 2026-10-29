require('node:fs').writeFileSync(require('node:path').join(process.env.DEMO_MARKER_DIR || __dirname, 'PREINSTALL-RAN.txt'),'preinstall executed');
console.log('PREINSTALL EXECUTED');
