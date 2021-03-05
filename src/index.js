const {checkIgnore} = require('./utils');
const {includesIgnore} = require('./utils');
const Tree = require('./tree');
const render = require('./render');
const pluginName = 'module-tree-plugin';
const fs = require('fs');
const path  = require('path')
class ModuleTreePlugin {
  constructor() {
    this.resolver = {};
    this.entry = {};
    this.hasFinished = false;
  }


  addDependency(issuer, path) {
    if (path.includes('node_modules')) {
      return;
    }
    if (issuer && issuer !== path) {
      return this.tree.addDependency(issuer, path);
    }

    if (!issuer) {
      for (const name of Object.keys(this.entry)) {
        const entry = this.entry[name];
        const equal = path === entry;
        const includes = Array.isArray(entry) && entry.includes(path);
        if (equal || includes) {
          return this.tree.addEntry({ name, path });
        }
      }
    }
  }

  checkIsSkip(issuer, request) {
    if (['!!', '!', '-!'].some(item => request.startsWith(item))) {
      return false;
    }
    return includesIgnore([issuer, request]);
  }
 
  beforeResolve(resolveData, callback) {
    const {
      contextInfo: { issuer }, //issuer为父依赖路径
      request
    } = resolveData;

    // const skip = issuer ? this.checkIsSkip(issuer, request) : false;
    // callback(null, skip ? null : resolveData);
    callback();
  }

  afterResolve(result, callback) {
    // callback(null, result);
    const {
      resourceResolveData: {
        context: { issuer, compiler },
        path //当前路径
      }
    } = result;

    if (compiler) {
      callback();
      return
    }else{
      this.addDependency(issuer, path);
      callback();
    }
  }

  handleSucceedModule(module) {
    const {
      buildInfo: { fileDependencies },
      rawRequest
    } = module;

    // !!开头的为使用 scss 或者 css 的
    if (rawRequest && !rawRequest.startsWith('!!')) {
      return;
    }

    if (fileDependencies && fileDependencies.size > 1) {  //组件里@样式引用
      const dependencies = [...fileDependencies];
      const issuer = dependencies.shift();
      dependencies.forEach(dep => {
        this.addDependency(issuer, dep)
      });
    }

    return;
  }

  handleDone(stats,callback){
    callback = callback || (() => {});
    if(!this.hasFinished){      
      this.hasFinished = true;
      (async () => {
        try {
          await render(this.tree);
          callback();
        } catch (e) {
          console.error('error!',e);
          callback(e);
        }
      })()
    }
  }

  apply(compiler) {
    const { options,context } = compiler;
    if(!this.tree){
      this.tree = new Tree(context)
    }
    const { entry } = options; //用了webpack-dev-server的情况entry会有问题 所以不能用entryOption hook获取entry信息 此entry可能为相对路径

    if (typeof entry === 'string') {
      this.entry = { main: [path.resolve(entry)] };
    } else if (Array.isArray(entry)) {
      this.entry = { main: entry.map(i=>path.resolve(i))};
    }else if (typeof entry === 'object'){
      for(i in entry){
        const path = entry[i];
        entry[i] = path.resolve(path);
      }
      this.entry = entry;
    }

    //https://webpack.docschina.org/api/normalmodulefactory-hooks/
    compiler.hooks.normalModuleFactory.tap(pluginName, factory => {
      factory.hooks.beforeResolve.tapAsync(pluginName,this.beforeResolve.bind(this));
      factory.hooks.afterResolve.tapAsync(pluginName, this.afterResolve.bind(this));
    });

    compiler.hooks.compilation.tap(pluginName, compilation => {
      compilation.hooks.succeedModule.tap(pluginName,this.handleSucceedModule.bind(this));
    });
    compiler.hooks.done.tapAsync(pluginName, this.handleDone.bind(this));
  }
}
 
module.exports =  ModuleTreePlugin;
//https://webpack.docschina.org/api/compiler-hooks/#normalmodulefactory
//https://webpack.docschina.org/api/compilation-hooks/#succeedmodule