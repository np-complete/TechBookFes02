import fs from 'fs';

['plugin-equalequal',
 'plugin-reactive',
 'plugin-a1', 'plugin-a2', 'plugin-b1', 'plugin-b2', 'plugin-c', 'plugin-d',
 'preset-a', 'preset-b',
].forEach(f => {
  fs.writeFileSync(`./node_modules/babel-${f}.js`, `module.exports = require('../${f}');`);
});
