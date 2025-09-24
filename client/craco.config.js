module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "fs": false,
        "path": false,
        "os": false,
        "crypto": false,
        "stream": false,
        "buffer": false,
        "process": false,
        "util": false,
        "assert": false,
        "http": false,
        "https": false,
        "url": false,
        "zlib": false
      };

      // Ignore specific warnings for face-api.js and Node.js modules
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module not found: Error: Can't resolve 'fs'/,
        /Module not found: Error: Can't resolve 'path'/,
        /Module not found: Error: Can't resolve 'os'/,
        /Module not found: Error: Can't resolve 'crypto'/,
        /Module not found: Error: Can't resolve 'stream'/,
        /Module not found: Error: Can't resolve 'buffer'/,
        /Module not found: Error: Can't resolve 'process'/,
        /Module not found: Error: Can't resolve 'util'/,
        /Module not found: Error: Can't resolve 'assert'/,
        /Module not found: Error: Can't resolve 'http'/,
        /Module not found: Error: Can't resolve 'https'/,
        /Module not found: Error: Can't resolve 'url'/,
        /Module not found: Error: Can't resolve 'zlib'/,
        /Critical dependency: the request of a dependency is an expression/
      ];

      return webpackConfig;
    },
  },
};