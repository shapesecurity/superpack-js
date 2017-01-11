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
      'bs_sierra_safari10',
      'bs_win7_ie9',
      'bs_android_samsunggal44',
      'bs_win10_edge14',
      'bs_win10_ff50',
      'bs_win10_chrome55',
    ],

    customLaunchers: {
      'bs_android_samsunggal44': {
        base: 'BrowserStack',
        os: 'Android',
        'os_version': 4.4,
        browser: 'Android Browser',
        device: 'Samsung Galaxy S5'
      },
      'bs_iphone_91': {
        base: 'BrowserStack',
        os: 'iOS',
        'os_version': 9.3,
        browser: 'iPhone',
        device: 'iPad Mini 4'
      },
      'bs_sierra_safari10': {
        base: 'BrowserStack',
        os: 'OS X',
        'os_version': 'Sierra',
        browser: 'Safari',
        'browser_version': '10.0'
      },
      'bs_win10_ff50': {
        base: 'BrowserStack',
        os: 'Windows',
        'os_version': '10',
        browser: 'Firefox',
        'browser_version': '50'
      },
      'bs_win10_chrome55': {
        base: 'BrowserStack',
        os: 'Windows',
        'os_version': '10',
        browser: 'Chrome',
        'browser_version': '55'
      },
      'bs_win10_ie11': {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '10',
        'browser': 'IE',
        'browser_version': '11.0',
      },
      'bs_win10_edge14': {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '10',
        'browser': 'Edge',
        'browser_version': '14.0',
      },
      'bs_win7_ie9': {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '7',
        'browser': 'IE',
        'browser_version': '9.0',
      }
    },

    logLevel: config.LOG_INFO,

    autoWatch: false,

    singleRun: true

  });
};
