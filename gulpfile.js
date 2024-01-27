'use strict';

const build = require('@microsoft/sp-build-web');
const fs = require('fs');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    // find the Define plugins
    let plugin, pluginDefine;
    for (var i = 0; i < generatedConfiguration.plugins.length; i++) {
      plugin = generatedConfiguration.plugins[i];
      if (plugin.definitions !== undefined) {
        pluginDefine = plugin;
      }
    }

    if (pluginDefine !== null) {
      const settingsFilePath = './config/settings.json';
      let settingsJSON = JSON.parse(fs.readFileSync(settingsFilePath));

      for (const key in settingsJSON) {
        console.log(`${key} -> ${settingsJSON[key]}`);
        pluginDefine.definitions[key] = JSON.stringify(settingsJSON[key]);
      }
    }
    return generatedConfiguration;
  }
});

build.initialize(require('gulp'));
