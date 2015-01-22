# Angular Couch Query
[![Build Status](https://travis-ci.org/eHealthAfrica/angular-couch-query.svg?branch=0.0.0)](https://travis-ci.org/eHealthAfrica/angular-couch-query)
> Navigate results of Couch views and Lucene queries easily

This module requires [ngLodash](https://github.com/rockabox/ng-lodash)
as a dependency, thus please add it to your app following its
documentation, before adding this one

## Origins

These few services were extracted from the Ebola call centre, because
the same functionality is needed also for the Ebola case management
dashboard

## How to lint, build, run the tests, etcetera

    $ npm install
    $ bower install
    $ grunt

## How to do a new release

- update the change log adding a release number and a release date
- use `grunt bump` with a version level matching the changes in the change log

The change log will be committed automatically by `grunt bump`

##### Repo structure

The structure comes from bootstrapping with
`generator-angularjs-library`, version 1.4.0
