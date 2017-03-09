/* eslint-disable camelcase */
module.exports = function (config) {
  // Set base config
  config.set(require('./base.conf'));

  // Set custom config for this environment
  config.set({

    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      project: 'superpack'
    },
    reporters: ['mocha'],
    browsers: [
      'Windows_7_ie__9',
      'Windows_10_edge__14',
      'Windows_8_chrome__56',
      'Windows_10_firefox__52',
      'OSX_Sierra_safari__10',
      'android_44_android_SamsungGalaxyTab4101_',
      'ios_91_iphone_iPhone6S_'
    ],

    customLaunchers: {
      Windows_7_ie__9: {
        os: 'Windows',
        os_version: '7',
        browser: 'ie',
        device: null,
        browser_version: '9.0',
        base: 'BrowserStack' },
      Windows_10_edge__14: {
        os: 'Windows',
        os_version: '10',
        browser: 'edge',
        device: null,
        browser_version: '14.0',
        base: 'BrowserStack' },
      Windows_8_chrome__56: {
        os: 'Windows',
        os_version: '8',
        browser: 'chrome',
        device: null,
        browser_version: '56.0',
        base: 'BrowserStack' },
      Windows_10_firefox__52: {
        os: 'Windows',
        os_version: '10',
        browser: 'firefox',
        device: null,
        browser_version: '52.0 beta',
        base: 'BrowserStack' },
      OSX_Sierra_safari__10: {
        os: 'OS X',
        os_version: 'Sierra',
        browser: 'safari',
        device: null,
        browser_version: '10.0',
        base: 'BrowserStack' },
      android_44_android_SamsungGalaxyTab4101_: {
        os: 'android',
        os_version: '4.4',
        browser: 'android',
        device: 'Samsung Galaxy Tab 4 10.1',
        browser_version: null,
        base: 'BrowserStack' },
      ios_91_iphone_iPhone6S_: {
        os: 'ios',
        os_version: '9.1',
        browser: 'iphone',
        device: 'iPhone 6S',
        browser_version: null,
        base: 'BrowserStack' }
    },

    logLevel: config.LOG_INFO,

    autoWatch: false,

    singleRun: true

  });
};
