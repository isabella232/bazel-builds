/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Rollup configuration
// GENERATED BY Bazel

const nodeResolve = require('rollup-plugin-node-resolve');
const sourcemaps = require('rollup-plugin-sourcemaps');
const commonjs = require('rollup-plugin-commonjs');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');

function log_verbose(...m) {
  // This is a template file so we use __filename to output the actual filename
  if (!!process.env['VERBOSE_LOGS']) console.error(`[${path.basename(__filename)}]`, ...m);
}

const workspaceName = 'TMPL_workspace_name';
const rootDir = 'TMPL_root_dir';
const bannerFile = TMPL_banner_file;
const stampData = TMPL_stamp_data;
const moduleMappings = TMPL_module_mappings;
const downlevelToEs5 = TMPL_downlevel_to_es5;
const nodeModulesRoot = 'TMPL_node_modules_root';

log_verbose(`running with
  cwd: ${process.cwd()}
  workspaceName: ${workspaceName}
  rootDir: ${rootDir}
  bannerFile: ${bannerFile}
  stampData: ${stampData}
  moduleMappings: ${JSON.stringify(moduleMappings)}
  nodeModulesRoot: ${nodeModulesRoot}
`);

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
}

// This resolver mimics the TypeScript Path Mapping feature, which lets us resolve
// modules based on a mapping of short names to paths.
function resolveBazel(
    importee, importer, baseDir = process.cwd(), resolve = require.resolve, root = rootDir) {
  log_verbose(`resolving '${importee}' from ${importer}`);

  function resolveInRootDir(importee) {
    var candidate = path.join(baseDir, root, importee);
    log_verbose(`try to resolve '${importee}' at '${candidate}'`);
    try {
      var result = resolve(candidate);
      return result;
    } catch (e) {
      return undefined;
    }
  }

  // Since mappings are always in POSIX paths, when comparing the importee to mappings
  // we should normalize the importee.
  // Having it normalized is also useful to determine relative paths.
  const normalizedImportee = importee.replace(/\\/g, '/');

  // If import is fully qualified then resolve it directly
  if (fileExists(importee)) {
    log_verbose(`resolved fully qualified '${importee}'`);
    return importee;
  }

  var resolved;
  if (normalizedImportee.startsWith('./') || normalizedImportee.startsWith('../')) {
    // relative import
    if (importer) {
      let importerRootRelative = path.dirname(importer);
      const relative = path.relative(path.join(baseDir, root), importerRootRelative);
      if (!relative.startsWith('.')) {
        importerRootRelative = relative;
      }
      resolved = path.join(importerRootRelative, importee);
    } else {
      throw new Error('cannot resolve relative paths without an importer');
    }
    if (resolved) resolved = resolveInRootDir(resolved);
  }

  if (!resolved) {
    // possible workspace import or external import if importee matches a module
    // mapping
    for (const k in moduleMappings) {
      if (normalizedImportee == k || normalizedImportee.startsWith(k + '/')) {
        // replace the root module name on a mappings match
        // note that the module_root attribute is intended to be used for type-checking
        // so it uses eg. "index.d.ts". At runtime, we have only index.js, so we strip the
        // .d.ts suffix and let node require.resolve do its thing.
        var v = moduleMappings[k].replace(/\.d\.ts$/, '');
        const mappedImportee = path.join(v, normalizedImportee.slice(k.length + 1));
        log_verbose(`module mapped '${importee}' to '${mappedImportee}'`);
        resolved = resolveInRootDir(mappedImportee);
        if (resolved) break;
      }
    }
  }

  if (!resolved) {
    // workspace import
    const userWorkspacePath = path.relative(workspaceName, importee);
    resolved = resolveInRootDir(userWorkspacePath.startsWith('..') ? importee : userWorkspacePath);
  }

  if (resolved) {
    if (path.extname(resolved) == '.js') {
      // check for .mjs file and prioritize that
      const resolved_mjs = resolved.substr(0, resolved.length - 3) + '.mjs';
      if (fileExists(resolved_mjs)) {
        resolved = resolved_mjs;
      }
    }
    log_verbose(`resolved to ${resolved}`);
  } else {
    log_verbose(`allowing rollup to resolve '${importee}' with node module resolution`);
  }

  return resolved;
}

let banner = '';
if (bannerFile) {
  banner = fs.readFileSync(bannerFile, {encoding: 'utf-8'});
  if (stampData) {
    const versionTag = fs.readFileSync(stampData, {encoding: 'utf-8'})
                           .split('\n')
                           .find(s => s.startsWith('BUILD_SCM_VERSION'));
    // Don't assume BUILD_SCM_VERSION exists
    if (versionTag) {
      const version = versionTag.split(' ')[1].trim();
      banner = banner.replace(/10.1.5+18.sha-3487d5a/, version);
    }
  }
}

// Transform that is enabled for UMD bundle processing. It transforms existing ES2015
// prodmode output to ESM5 so that the resulting UMD bundles are using ES5 format.
const downlevelToEs5Plugin = {
  name: 'downlevel-to-es5',
  transform: (code, filePath) => {
    const compilerOptions = {
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.ES2015,
      allowJs: true,
      sourceMap: true,
      downlevelIteration: true,
      importHelpers: true,
      mapRoot: path.dirname(filePath),
    };
    const {outputText, sourceMapText} = ts.transpileModule(code, {compilerOptions});
    return {
      code: outputText,
      map: JSON.parse(sourceMapText),
    };
  },
};

const plugins = [
  {
    name: 'resolveBazel',
    resolveId: resolveBazel,
  },
  nodeResolve({
    mainFields: ['browser', 'es2015', 'module', 'jsnext:main', 'main'],
    jail: process.cwd(),
    customResolveOptions: {moduleDirectory: nodeModulesRoot}
  }),
  commonjs({ignoreGlobal: true}),
  sourcemaps(),
];

// If downleveling to ES5 is enabled, set up the downlevel rollup plugin.
if (downlevelToEs5) {
  plugins.push(downlevelToEs5Plugin);
}

const config = {
  plugins,
  external: [TMPL_external],
  output: {
    globals: {TMPL_globals},
    banner,
  }
};

module.exports = config;
