const fs =require('fs');
const nodePath = require('path');
class Dependency {
  constructor({ path,name }) {
    this.type = 'module';
    this.path = path;
    this.children = [];
    this.name = name;
  }

  add(dep) {
    const { children } = this;
    children.push(dep);
  }

  has(filepath) {
    const { children, path } = this;
    if (path === filepath) return true;
    return children.some(child => child.has(filepath));
  }

  remove() {
    this.children = [];
  }
}

class EntryDependency extends Dependency {
  constructor(props) {
    super(props);
    this.type = 'entry';
    this.name = props.name;
    this.haa ='aaa'
  }
}

module.exports = class Tree {
  constructor(context) {
    this.children = [];
    this.cache = new Map();
    this.name = context; //目录
  }


  setDependency(children, issuer, filepath) {
    for (const dependency of children) {
      const { children: subDependencies, path } = dependency;
      if (path === issuer) {
        return dependency.add(new Dependency({ path: filepath,name: nodePath.relative(this.name,filepath) }));
      }
      this.setDependency(subDependencies, issuer, filepath);
    }
  }

  addEntry({ name, path }) {
    this.children.push(new EntryDependency({ path, name }));
  }

  addDependency(issuer, filepath) {
    const { cache, children } = this;
    if (cache.get(issuer) === filepath) return;
    cache.set(issuer, filepath);
    this.setDependency(children, issuer, filepath);
  }
};


