'use strict';

module.exports.getNewInstance = function () {
  var Importer = function Importer() {
    var modules = {};
    var getModulesContext = function getModulesContext() {
      return require.context('.', false, /override-me-in-webpack-config$/);
    };
    var getFileName = function getFileName(string) {
      return string.match(/[^\\|/]*(?=[.][a-zA-Z]+$)/)[0];
    };
    var contextId = void 0;
    var moduleKey = void 0;

    this.getModules = function (config) {
      moduleKey = config.moduleKey;
      var context = getModulesContext();
      contextId = context.id;
      context.keys().forEach(function (key) {
        var fileName = getFileName(key);
        if (fileName.slice(-6) === '-store') {
          modules[fileName] = moduleKey ? context(key)[moduleKey] : context(key);
        }
      });

      return modules;
    };

    this.setupHMR = function (hmrHandler) {
      if (module.hot) {
        module.hot.accept(contextId, function () {
          var updatedModules = {};

          var reloadedContext = getModulesContext();
          var allModules = reloadedContext.keys().map(function (key) {
            return {
              name: getFileName(key),
              object: moduleKey ? reloadedContext(key)[moduleKey] : reloadedContext(key)
            };
          });

          var newModules = allModules.filter(function (reloadedModule) {
            return reloadedModule.name.slice(-6) === '-store';
          }).filter(function (reloadedModule) {
            return modules[reloadedModule.name] !== reloadedModule.object;
          });

          newModules.forEach(function (module) {
            modules[module.name] = module.object;
            updatedModules[module.name] = module.object;
            console.info('[HMR] - Modules are replaced');
          });

          hmrHandler(updatedModules);
        });
      }
    };
  };

  return new Importer();
};

