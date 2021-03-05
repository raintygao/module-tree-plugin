const fs = require('fs');
const express = require('express');
const http = require('http');
const opener = require('opener');
const path = require('path')
const projectRoot = path.resolve(__dirname, '..');
const viewsRoot = path.resolve(__dirname, 'views');
const assetsRoot = path.join(projectRoot, 'public');
const ejs = require('ejs');
const { bold } = require('chalk');

const Logger = require('./Logger');


async function render (tree){
  const app = express();
  app.engine('ejs', require('ejs').renderFile);
  app.set('views', `${projectRoot}/views`);
  app.set('view engine', 'ejs');
  app.use(express.static(`${projectRoot}/public`));
  const data = tree.children.length === 1?tree.children[0]:tree;

  app.use('/', (req, res) => {
    res.render('index', {
      mode: 'server',
      title: 'hello',
      defaultSizes: 'parsed',
      renderData:JSON.stringify(data),
    });
  });



  let port = 1024,host = '127.0.0.1';
  const server = http.createServer(app);
  await new Promise(resolve => {
    server.listen(port, host, () => {
      resolve();

      const url = `http://${host}:${server.address().port}`;

      new Logger().info(
        `${bold('Module Tree Plugin')} is started at ${bold(url)}\n` +
        `Use ${bold('Ctrl+C')} to close it`
      );
      open(url);
    });
  });
}

 function open (uri) {
  try {
    opener(uri);
  } catch (err) {
    console.debug(`Opener failed to open "${uri}":\n${err}`);
  }
}

module.exports = render;