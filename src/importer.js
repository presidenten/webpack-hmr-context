/**
 * Get new instance of the importer
 */
module.exports.getNewInstance = () => {
  const Importer = function () {
    const modules = {};
    const getModulesContext = () => require.context('.', false, /override-me-in-webpack-config$/);
    const getFileName = string => string.match(/[^\\|/]*(?=[.][a-zA-Z]+$)/)[0];
    let contextId;
    let moduleKey;

    /**
     * Returns an object with loaded modules
     *
     * @param {Object} config - Set `config.moduleKey` if importing specfic key from modules.
     */
    this.getModules = (config) => {
      moduleKey = config.moduleKey;
      const context = getModulesContext();
      contextId = context.id;
      context.keys().forEach((key) => {
        const fileName = getFileName(key);
        if (fileName.slice(-6) === '-store') {
          modules[fileName] = moduleKey ? context(key)[moduleKey] : context(key);
        }
      });

      return modules;
    };

    /**
     * @callback callback
     * @param {Object}
     */
    /**
     * Returns an object with loaded modules
     *
     * @param {callback} hmrHandler - The hmrHandler is called with the newModules
     */

    this.setupHMR = (hmrHandler) => {
      if (module.hot) {
        // Accept last context as input
        module.hot.accept(contextId, () => {
          let updatedModules = {};
          // Require the updated modules
          const reloadedContext = getModulesContext();
          let allModules = reloadedContext.keys()
            .map(key => ({
              name: getFileName(key),
              object: moduleKey ? reloadedContext(key)[moduleKey] : reloadedContext(key),
            }));

          let newModules = allModules
                            .filter(reloadedModule => reloadedModule.name.slice(-6) === '-store')
                            .filter(reloadedModule => modules[reloadedModule.name] !== reloadedModule.object);

          // Update changed modules
          newModules.forEach((module) => {
            modules[module.name] = module.object;
            updatedModules[module.name] = module.object;
            console.info('[HMR] - Modules are replaced');
          });

          // Handle the new modules
          hmrHandler(updatedModules);
        });
      }
    };
  };

  return new Importer();
};
