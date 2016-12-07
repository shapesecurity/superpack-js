module.exports = function (config) {
  // Set base config
  config.set(require('./base.conf'));

  config.set({
    // CLI --browsers Chrome,Firefox
    browsers: ['Chrome', 'Firefox'],
  });
};
