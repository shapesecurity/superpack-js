/* eslint-disable camelcase */

const IE = [
  'bs_win10_ie11',
  'bs_win81_ie11',
  'bs_win7_ie11',
  'bs_win8_ie10',
  'bs_win7_ie10',
  'bs_win7_ie9',
];

const EDGE = [
  'bs_win10_edge14',
  'bs_win10_edge13',
];

const SAFARI = [
  'bs_sierra_safari10',
  'bs_elcapitan_safari9',
  'bs_yosemite_safari8',
  'bs_mavericks_safari7',
];

const FIREFOX = [
  'bs_win10_ff52',
  'bs_win10_ff51',
  'bs_win10_ff50',
  'bs_win10_ff49',
  'bs_win10_ff48',
  'bs_win10_ff47',
  'bs_win7_ff46',
  'bs_win7_ff45',
];

const CHROME = [
  'bs_win10_chrome56',
  'bs_win10_chrome55',
  'bs_win10_chrome54',
  'bs_win10_chrome53',
  'bs_win10_chrome52',
  'bs_win8_chrome51',
  'bs_win8_chrome50',
  'bs_win8_chrome49',
  'bs_win7_chrome48',
];

const ANDROID = [
  'bs_android_htc44',
  'bs_android_samsungtab44',
  'bs_android_samsunggal44',
];

const IPHONE = [
  'bs_iphone_10',
  'bs_iphone_93',
  'bs_iphone_83',
];

let browsers = [];

if (process.env.BROWSERS == null) {
  browsers = [].concat(IE, EDGE, SAFARI, FIREFOX, CHROME, ANDROID, IPHONE);
} else {
  // example usage: BROWSERS=IE,SAFARI,ANDROID npm run test:ci
  if (/\bIE\b/i.test(process.env.BROWSERS)) {
    browsers = browsers.concat(IE);
  }
  if (/\bEDGE\b/i.test(process.env.BROWSERS)) {
    browsers = browsers.concat(EDGE);
  }
  if (/\bSAFARI\b/i.test(process.env.BROWSERS)) {
    browsers = browsers.concat(SAFARI);
  }
  if (/\bFIREFOX\b/i.test(process.env.BROWSERS)) {
    browsers = browsers.concat(FIREFOX);
  }
  if (/\bCHROME\b/i.test(process.env.BROWSERS)) {
    browsers = browsers.concat(CHROME);
  }
  if (/\bANDROID\b/i.test(process.env.BROWSERS)) {
    browsers = browsers.concat(ANDROID);
  }
  if (/\bIPHONE\b/i.test(process.env.BROWSERS)) {
    browsers = browsers.concat(IPHONE);
  }
}


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
    browsers: browsers,

    customLaunchers: {
      bs_win10_ie11: {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '10',
        'browser': 'IE',
        'browser_version': '11.0',
      },
      bs_win10_edge14: {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '10',
        'browser': 'Edge',
        'browser_version': '14.0',
      },
      bs_win10_edge13: {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '10',
        'browser': 'Edge',
        'browser_version': '13.0',
      },
      bs_win81_ie11: {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '8.1',
        'browser': 'IE',
        'browser_version': '11.0'
      },
      bs_win8_ie10: {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '8',
        'browser': 'IE',
        'browser_version': '10.0',
      },
      bs_win7_ie11: {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '7',
        'browser': 'IE',
        'browser_version': '11.0',
      },
      bs_win7_ie10: {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '7',
        'browser': 'IE',
        'browser_version': '10.0',
      },
      bs_win7_ie9: {
        base: 'BrowserStack',
        'os': 'Windows',
        'os_version': '7',
        'browser': 'IE',
        'browser_version': '9.0',
      },
      bs_sierra_safari10: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Sierra',
        browser: 'Safari',
        browser_version: '10.0'
      },
      bs_elcapitan_safari9: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'El Capitan',
        browser: 'Safari',
        browser_version: '9.1'
      },
      bs_yosemite_safari8: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Yosemite',
        browser: 'Safari',
        browser_version: '8'
      },
      bs_mavericks_safari7: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Mavericks',
        browser: 'Safari',
        browser_version: '7.1'
      },
      bs_win10_ff52: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Firefox',
        browser_version: '52'
      },
      bs_win10_ff51: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Firefox',
        browser_version: '51'
      },
      bs_win10_ff50: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Firefox',
        browser_version: '50'
      },
      bs_win10_ff49: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Firefox',
        browser_version: '49'
      },
      bs_win10_ff48: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Firefox',
        browser_version: '48'
      },
      bs_win10_ff47: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Firefox',
        browser_version: '47'
      },
      bs_win7_ff46: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '7',
        browser: 'Firefox',
        browser_version: '46'
      },
      bs_win7_ff45: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '7',
        browser: 'Firefox',
        browser_version: '45'
      },
      bs_win10_chrome56: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Chrome',
        browser_version: '55'
      },
      bs_win10_chrome55: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Chrome',
        browser_version: '55'
      },
      bs_win10_chrome54: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Chrome',
        browser_version: '54'
      },
      bs_win10_chrome53: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Chrome',
        browser_version: '53'
      },
      bs_win10_chrome52: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Chrome',
        browser_version: '52'
      },
      bs_win8_chrome51: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '8',
        browser: 'Chrome',
        browser_version: '51'
      },
      bs_win8_chrome50: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '8',
        browser: 'Chrome',
        browser_version: '50'
      },
      bs_win8_chrome49: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '8',
        browser: 'Chrome',
        browser_version: '49'
      },
      bs_win7_chrome48: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '8',
        browser: 'Chrome',
        browser_version: '48'
      },
      bs_android_htc44: {
        base: 'BrowserStack',
        os: 'Android',
        os_version: 4.4,
        browser: 'Android Browser',
        device: 'HTC One M8'
      },
      bs_android_samsungtab44: {
        base: 'BrowserStack',
        os: 'Android',
        os_version: 4.4,
        browser: 'Android Browser',
        device: 'Samsung Galaxy Tab 4 10.1'
      },
      bs_android_samsunggal44: {
        base: 'BrowserStack',
        os: 'Android',
        os_version: 4.4,
        browser: 'Android Browser',
        device: 'Samsung Galaxy S5'
      },
      bs_iphone_10: {
        base: 'BrowserStack',
        os: 'ios',
        os_version: '10.0',
        browser: 'Mobile Safari',
        device: 'iPhone SE'
      },
      bs_iphone_93: {
        base: 'BrowserStack',
        os: 'ios',
        os_version: '9.3',
        browser: 'Mobile Safari',
        device: 'iPhone 6S'
      },
      bs_iphone_83: {
        base: 'BrowserStack',
        os: 'ios',
        os_version: '8.3',
        browser: 'Mobile Safari',
        device: 'iPhone 6'
      }
    },

    logLevel: config.LOG_INFO,

    autoWatch: false,

    singleRun: true

  });
};
