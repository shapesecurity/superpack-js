let babelify = require('babelify'),
    istanbul = require('browserify-istanbul');

module.exports = {
  basePath: '../',

  frameworks: ['mocha', 'browserify'],

  files: ['test/spec/**/*.spec.js'],

  preprocessors: { 'test/**/*.js': ['browserify'] },

  browserify: {
    debug: true,
    transform: [
      babelify.configure({
        presets: ['es2015']
      }),
      istanbul({
        ignore: ['**/test/**'],
        instrumenterConfig: {
          embedSource: true
        }
      })
    ]
  },

  coverageReporter: {
    reporters: [
      { type: 'text', dir: 'build/coverage/' }
    ],
    check: {
      global: {
        statements: 86,
        branches: 70,
        functions: 91,
        lines: 86
      },
      each: {
        statements: 80,
        branches: 60,
        functions: 85,
        lines: 80,
      }
    }
  },

  reporters: ['mocha', 'coverage'],

  // web server port
  // CLI --port 9876
  port: 8888,

  // enable / disable colors in the output (reporters and logs)
  // CLI --colors --no-colors
  colors: true,

  // level of logging
  // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
  // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
  // CLI --log-level debug
  logLevel: 'warn',

  // enable / disable watching file and executing tests
  // whenever any file changes
  // CLI --auto-watch --no-auto-watch
  autoWatch: false,

  browsers: [],

  // If browser does not capture in given timeout [ms], kill it
  // CLI --capture-timeout 20000
  captureTimeout: 220000,

  // Auto run tests on start (when browsers are captured) and exit
  // CLI --single-run --no-single-run
  singleRun: true,

  // report which specs are slower than 500ms
  // CLI --report-slower-than 500
  reportSlowerThan: 500,

  browserNoActivityTimeout: 50000,
};
