#!/usr/bin/env node
'use strict'

var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var async = require('async');
var yaml = require('yamljs');
var spawn = require('child_process').spawn;
var repoName = 'bitcoin';
var tag = '--single-branch';
var url = 'https://github.com/bitpay/bitcoin';
var configFile = 'gitian-linux.yml';
var buildDir = '/tmp/';
var setupDirs = ['install', 'out', 'build', 'cache'];

console.log('Step 1: processing arguments from launch...');
if (process.argv.length < 5) {
  console.log('-----------------------------------------------------------');
  console.log('Tag/SHA and/or URL not passed in, therefore defaulting to:');
  console.log('');
  console.log('HEAD on default branch of https://github.com/bitpay/bitcoin');
  console.log('Building: gitian-linux.yml');
  console.log('-----------------------------------------------------------');
} else {
  tag = '-b ' + process.argv[2];
  url = process.argv[3];
  configFile = process.argv[4];
}

console.log('Step 2: cloning the project to get config and source code...');
var clone = spawn('git', ['clone', tag, '--depth=1', url, repoName]);

clone.on('error', function(err) {
  console.log(err);
  process.exit(1);
});

clone.stdout.on('data', function(data){
  console.log(data.toString());
});

clone.on('close', function() {
  console.log('Step 3: loading the yaml config into memory and creating build directories...');
  async.parallel([loadConfig, setup], function(err, res) {
    emitter.emit('setup complete', err, res[0]);
  });
});

emitter.on('setup complete', function(err, config) {
  if (err) {
    console.log('Error: ', err);
    process.exit(-1);
  }
  console.log('Setup and ready to go...');
  console.log('Step 4: Launching a subshell to run the script provided by the target project...');
  processConfig(config, build);
});

var processConfig = function(config, cb) {
  cb(config);
}

emitter.on('build complete', function(err, res) {
});

var build = function(config, cb) {
  var script = '#!/bin/bash \n\
  set -e \n\
  pushd ' + buildDir + ' \n\
  export LANG="en_US.UTF-8" \n\
  export LC_ALL="en_US.UTF-8" \n\
  umask 002 \n\
  export OUTDIR=' + buildDir + '/out \n\
  GBUILD_BITS=' + bits + ' \n\
  GBUILD_CACHE_ENABLED=1 \n\
  GBUILD_PACKAGE_CACHE=' + buildDir + '/cache/' + config.name + ' \n\
  GBUILD_COMMON_CACHE=' + buildDir + '/cache/common' + ' \n\
  MAKEOPTS=(-j2) \n\
  REFERENCE_DATETIME=' + config.reference_datetime;
}

var loadConfig = function(cb) {
  yaml.load(repoName + '/contrib/gitian-descriptors/' + configFile, function(config) {
    cb(null, config);
  });
}

var setup = function(cb) {
  var args = [];
  for (var i = 0; i < setupDirs.length; i++) {
    args.push(buildDir + setupDirs[i]);
  }
  args.unshift('-fr');
  var rm = spawn('rm', args);
  rm.on('close', function() {
    args.shift();
    var mkdir = spawn('mkdir', args)
    mkdir.on('error', function() {
      process.exit(-1);
    });
    mkdir.on('close', function() {
      cb();
    });
  });
}

