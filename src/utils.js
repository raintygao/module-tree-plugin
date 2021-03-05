const includes = tpl => {
  const list = ['babel-runtime', 'prop-types'];
  return tpl ? list.some(item => tpl.includes(item)) : false;
};

module.exports.includesIgnore =  function(tpl) {
  if (Array.isArray(tpl)) {
    return tpl.some(item => includes(item));
  }
  return includes(tpl);
};
