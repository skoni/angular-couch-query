module.exports = function (grunt) {
  'use strict';
  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ''
      },
      library: {
        src: [
          'bower/fold-to-ascii-js/fold-to-ascii.js',
          'src/eHealth.couchQuery/eHealth.couchQuery.prefix',
          'src/eHealth.couchQuery/eHealth.couchQuery.js',
          'src/eHealth.couchQuery/directives/**/*.js',
          'src/eHealth.couchQuery/filters/**/*.js',
          'src/eHealth.couchQuery/services/**/*.js',
          'src/eHealth.couchQuery/eHealth.couchQuery.suffix'
        ],
        dest: 'dist/ehealth-couch-query.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      jid: {
        files: {
          'dist/ehealth-couch-query.min.js': ['<%= concat.library.dest %>']
        }
      }
    },
    jshint: {
      beforeConcat: {
        options: {
          // allow to have global 'use stricts'
          // statements. strict statements will be removed
          // anyway from the `remove_usestrict` task below
          globalstrict: true,
          globals: {
            'angular': false,
            'foldToASCII': false
          }
        },
        src: ['gruntfile.js', 'src/eHealth.couchQuery/**/*.js']
      },
      afterConcat: {
        src: [
          '<%= concat.library.dest %>'
        ]
      },
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true,
          angular: true
        },
        globalstrict: false
      }
    },
    watch: {
      options: {
        livereload: true
      },
      files: [
        'Gruntfile.js',
        'src/**/*'
      ],
      tasks: ['default']
    },
    remove_usestrict: {
      dist: {
        files: [{
          expand: true,
          src: 'dist/ehealth-couch-query.js'
        }]
      }
    },
    karma: {
      unit: {
        configFile: 'karma-unit.conf.js',
        singleRun: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-remove-usestrict');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', [
    'jshint:beforeConcat',
    'concat',
    'remove_usestrict',
    'jshint:afterConcat',
    'uglify',
    'karma'
  ]);
  grunt.registerTask('livereload', ['default', 'watch']);

};
