#!/usr/bin/env node

const [ a, file, ...args] = process.argv;
// console.log('hello world', a, file,args);

const { nodeNginxApp } = require('../app');

nodeNginxApp(file, args);