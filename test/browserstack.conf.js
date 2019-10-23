/* eslint-disable camelcase */

const IE = [
  'Windows_7_ie__9',
  'Windows_8_ie__10',
  'Windows_10_ie__11',
];

const EDGE = [
  'Windows_10_edge__15',
  'Windows_10_edge__16',
  'Windows_10_edge__17',
  'Windows_10_edge__18',
];

const SAFARI = [
  'OSX_Mojave_safari__121',
  'OSX_HighSierra_safari__111',
  'OSX_Sierra_safari__101',
  'OSX_ElCapitan_safari__91',
];

const FIREFOX = [
  'Windows_10_firefox__66',
  'Windows_10_firefox__67',
  'Windows_10_firefox__68',
  'Windows_10_firefox__69',
  'Windows_10_firefox__70',
];

const CHROME = [
  'Windows_10_chrome__74',
  'Windows_10_chrome__75',
  'Windows_10_chrome__76',
  'Windows_10_chrome__77',
  'Windows_10_chrome__78',
];

const ANDROID = [
  'android_90_AndroidBrowser_SamsungGalaxyS9Plus_',
  'android_81_AndroidBrowser_SamsungGalaxyTabS4_',
  'android_80_AndroidBrowser_SamsungGalaxyS9Plus_',
  'android_71_AndroidBrowser_SamsungGalaxyNote8_',
  'android_70_AndroidBrowser_SamsungGalaxyS8Plus_',
  'android_60_AndroidBrowser_SamsungGalaxyS7_',
  'android_50_AndroidBrowser_SamsungGalaxyS6_',
];

const IPHONE = [
  'ios_130_MobileSafari_iPhoneXS_',
  'ios_124_MobileSafari_iPhoneXS_',
  'ios_123_MobileSafari_iPhone8Plus_',
  'ios_122_MobileSafari_iPhoneXS_',
  'ios_121_MobileSafari_iPhoneXS_',
  'ios_114_MobileSafari_iPhoneX_',
  'ios_113_MobileSafari_iPhoneX_',
  'ios_112_MobileSafari_iPhoneX_',
  'ios_111_MobileSafari_iPhoneX_',
  'ios_110_MobileSafari_iPhoneX_',
  'ios_103_MobileSafari_iPhone7_',
];

const OTHERS = [
  'Windows_10_yandex__1412',
  'Windows_10_opera__58',
  'Windows_10_opera__60',
  'Windows_10_opera__62',
  'Windows_10_opera__63',
  'Windows_10_opera__64',
]

let browsers = [];

if (process.env.BROWSERS == null) {
  browsers = [].concat(IE, EDGE, SAFARI, FIREFOX, CHROME, ANDROID, IPHONE, OTHERS);
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
  if (/\bOTHERS\b/i.test(process.env.BROWSERS)) {
    browsers = browsers.concat(OTHERS);
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
      Windows_7_ie__9: {
        os: 'Windows',
        os_version: '7',
        browser: 'ie',
        device: null,
        browser_version: '9.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_8_ie__10: {
        os: 'Windows',
        os_version: '8',
        browser: 'ie',
        device: null,
        browser_version: '10.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_ie__11: {
        os: 'Windows',
        os_version: '10',
        browser: 'ie',
        device: null,
        browser_version: '11.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_edge__15: {
        os: 'Windows',
        os_version: '10',
        browser: 'edge',
        device: null,
        browser_version: '15.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_edge__16: {
        os: 'Windows',
        os_version: '10',
        browser: 'edge',
        device: null,
        browser_version: '16.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_edge__17: {
        os: 'Windows',
        os_version: '10',
        browser: 'edge',
        device: null,
        browser_version: '17.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_edge__18: {
        os: 'Windows',
        os_version: '10',
        browser: 'edge',
        device: null,
        browser_version: '18.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      OSX_Mojave_safari__121: {
        os: 'OS X',
        os_version: 'Mojave',
        browser: 'safari',
        device: null,
        browser_version: '12.1',
        real_mobile: null,
        base: 'BrowserStack'
      },
      OSX_HighSierra_safari__111: {
        os: 'OS X',
        os_version: 'High Sierra',
        browser: 'safari',
        device: null,
        browser_version: '11.1',
        real_mobile: null,
        base: 'BrowserStack'
      },
      OSX_Sierra_safari__101: {
        os: 'OS X',
        os_version: 'Sierra',
        browser: 'safari',
        device: null,
        browser_version: '10.1',
        real_mobile: null,
        base: 'BrowserStack'
      },
      OSX_ElCapitan_safari__91: {
        os: 'OS X',
        os_version: 'El Capitan',
        browser: 'safari',
        device: null,
        browser_version: '9.1',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_chrome__74: {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        device: null,
        browser_version: '74.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_chrome__75: {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        device: null,
        browser_version: '75.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_chrome__76: {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        device: null,
        browser_version: '76.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_chrome__77: {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        device: null,
        browser_version: '77.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_chrome__78: {
        os: 'Windows',
        os_version: '10',
        browser: 'chrome',
        device: null,
        browser_version: '78.0 beta',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_firefox__66: {
        os: 'Windows',
        os_version: '10',
        browser: 'firefox',
        device: null,
        browser_version: '66.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_firefox__67: {
        os: 'Windows',
        os_version: '10',
        browser: 'firefox',
        device: null,
        browser_version: '67.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_firefox__68: {
        os: 'Windows',
        os_version: '10',
        browser: 'firefox',
        device: null,
        browser_version: '68.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_firefox__69: {
        os: 'Windows',
        os_version: '10',
        browser: 'firefox',
        device: null,
        browser_version: '69.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_firefox__70: {
        os: 'Windows',
        os_version: '10',
        browser: 'firefox',
        device: null,
        browser_version: '70.0 beta',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_yandex__1412: {
        os: 'Windows',
        os_version: '10',
        browser: 'yandex',
        device: null,
        browser_version: '14.12',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_opera__58: {
        os: 'Windows',
        os_version: '10',
        browser: 'opera',
        device: null,
        browser_version: '58.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_opera__60: {
        os: 'Windows',
        os_version: '10',
        browser: 'opera',
        device: null,
        browser_version: '60.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_opera__62: {
        os: 'Windows',
        os_version: '10',
        browser: 'opera',
        device: null,
        browser_version: '62.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_opera__63: {
        os: 'Windows',
        os_version: '10',
        browser: 'opera',
        device: null,
        browser_version: '63.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      Windows_10_opera__64: {
        os: 'Windows',
        os_version: '10',
        browser: 'opera',
        device: null,
        browser_version: '64.0',
        real_mobile: null,
        base: 'BrowserStack'
      },
      android_90_AndroidBrowser_SamsungGalaxyS9Plus_: {
        os: 'android',
        os_version: '9.0',
        browser: 'Android Browser',
        device: 'Samsung Galaxy S9 Plus',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      android_81_AndroidBrowser_SamsungGalaxyTabS4_: {
        os: 'android',
        os_version: '8.1',
        browser: 'Android Browser',
        device: 'Samsung Galaxy Tab S4',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      android_80_AndroidBrowser_SamsungGalaxyS9Plus_: {
        os: 'android',
        os_version: '8.0',
        browser: 'Android Browser',
        device: 'Samsung Galaxy S9 Plus',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      android_71_AndroidBrowser_SamsungGalaxyNote8_: {
        os: 'android',
        os_version: '7.1',
        browser: 'Android Browser',
        device: 'Samsung Galaxy Note 8',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      android_70_AndroidBrowser_SamsungGalaxyS8Plus_: {
        os: 'android',
        os_version: '7.0',
        browser: 'Android Browser',
        device: 'Samsung Galaxy S8 Plus',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      android_60_AndroidBrowser_SamsungGalaxyS7_: {
        os: 'android',
        os_version: '6.0',
        browser: 'Android Browser',
        device: 'Samsung Galaxy S7',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      android_50_AndroidBrowser_SamsungGalaxyS6_: {
        os: 'android',
        os_version: '5.0',
        browser: 'Android Browser',
        device: 'Samsung Galaxy S6',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_130_MobileSafari_iPhoneXS_: {
        os: 'ios',
        os_version: '13.0',
        browser: 'Mobile Safari',
        device: 'iPhone XS',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_124_MobileSafari_iPhoneXS_: {
        os: 'ios',
        os_version: '12.4',
        browser: 'Mobile Safari',
        device: 'iPhone XS',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_123_MobileSafari_iPhone8Plus_: {
        os: 'ios',
        os_version: '12.3',
        browser: 'Mobile Safari',
        device: 'iPhone 8 Plus',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_122_MobileSafari_iPhoneXS_: {
        os: 'ios',
        os_version: '12.2',
        browser: 'Mobile Safari',
        device: 'iPhone XS',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_121_MobileSafari_iPhoneXS_: {
        os: 'ios',
        os_version: '12.1',
        browser: 'Mobile Safari',
        device: 'iPhone XS',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_114_MobileSafari_iPhoneX_: {
        os: 'ios',
        os_version: '11.4',
        browser: 'Mobile Safari',
        device: 'iPhone X',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_113_MobileSafari_iPhoneX_: {
        os: 'ios',
        os_version: '11.3',
        browser: 'Mobile Safari',
        device: 'iPhone X',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_112_MobileSafari_iPhoneX_: {
        os: 'ios',
        os_version: '11.2',
        browser: 'Mobile Safari',
        device: 'iPhone X',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_111_MobileSafari_iPhoneX_: {
        os: 'ios',
        os_version: '11.1',
        browser: 'Mobile Safari',
        device: 'iPhone X',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_110_MobileSafari_iPhoneX_: {
        os: 'ios',
        os_version: '11.0',
        browser: 'Mobile Safari',
        device: 'iPhone X',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      },
      ios_103_MobileSafari_iPhone7_: {
        os: 'ios',
        os_version: '10.3',
        browser: 'Mobile Safari',
        device: 'iPhone 7',
        browser_version: null,
        real_mobile: true,
        base: 'BrowserStack'
      }
    },

    logLevel: config.LOG_INFO,

    autoWatch: false,

    singleRun: true

  });
};
