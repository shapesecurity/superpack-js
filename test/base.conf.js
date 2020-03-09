'use strict';
module.exports = {
  basePath: '../',

  frameworks: ['mocha'],

  files: ['test/**/*.spec.js'],

  preprocessors: {
    'test/**/*.js': ['webpack', 'sourcemap'],
  },

  webpack: {
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
            plugins: [
              ['istanbul', {
                'exclude': 'test/**/*',
              }],
              'babel-plugin-transform-flow-strip-types',
            ],
          },
        },
      ],
    },
    devtool: 'inline-source-map',
  },

  reporters: ['mocha', 'coverage'],

  coverageReporter: {
    check: {
      global: {
        lines: 80,
        branches: 70,
        functions: 91,
        statements: 80,
      },
      each: {
        lines: 75,
        branches: 60,
        functions: 85,
        statements: 75,
      },
    },
    reporters: [
      { type: 'html', dir: './build/coverage/' },
    ],
  },

  concurrency: 2,

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
  logLevel: 'info',

  // enable / disable watching file and executing tests
  // whenever any file changes
  // CLI --auto-watch --no-auto-watch
  autoWatch: false,

  browsers: [],

  // If browser does not capture in given timeout [ms], kill it
  // CLI --capture-timeout 20000
  captureTimeout: 30e3,

  // Auto run tests on start (when browsers are captured) and exit
  // CLI --single-run --no-single-run
  singleRun: true,

  // report which specs are slower than 500ms
  // CLI --report-slower-than 500
  reportSlowerThan: 500,

  browserDisconnectTolerance: 10,

  browserNoActivityTimeout: 60e3,
};
