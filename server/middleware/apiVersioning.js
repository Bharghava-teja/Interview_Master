/**
 * API Versioning Middleware
 * Free solution for handling multiple API versions
 */

const { APIResponse, HTTP_STATUS } = require('../utils/responseFormatter');

// Supported API versions
const SUPPORTED_VERSIONS = ['v1', 'v2'];
const DEFAULT_VERSION = 'v1';

/**
 * Extract API version from request
 * Supports multiple methods: header, query param, URL path
 */
const extractVersion = (req) => {
  // Method 1: From Accept header (e.g., Accept: application/vnd.api+json;version=1)
  const acceptHeader = req.headers.accept;
  if (acceptHeader && acceptHeader.includes('version=')) {
    const versionMatch = acceptHeader.match(/version=(\d+)/);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }
  }

  // Method 2: From custom header (e.g., X-API-Version: v1)
  const versionHeader = req.headers['x-api-version'];
  if (versionHeader) {
    return versionHeader.toLowerCase();
  }

  // Method 3: From query parameter (e.g., ?version=v1)
  const versionQuery = req.query.version;
  if (versionQuery) {
    return versionQuery.toLowerCase();
  }

  // Method 4: From URL path (e.g., /api/v1/users)
  const pathMatch = req.path.match(/\/api\/(v\d+)\//i);
  if (pathMatch) {
    return pathMatch[1].toLowerCase();
  }

  return DEFAULT_VERSION;
};

/**
 * API Versioning Middleware
 */
function apiVersioning(req, res, next) {
  const requestedVersion = extractVersion(req);
  
  // Validate version
  if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
    const errorResponse = APIResponse.error(
      `API version '${requestedVersion}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      [{
        field: 'version',
        message: 'Unsupported API version',
        supportedVersions: SUPPORTED_VERSIONS
      }]
    );
    return errorResponse.send(res, HTTP_STATUS.BAD_REQUEST);
  }

  // Add version info to request object
  req.apiVersion = requestedVersion;
  req.isLatestVersion = requestedVersion === SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1];
  
  // Add version info to response headers
  res.set({
    'X-API-Version': requestedVersion,
    'X-Supported-Versions': SUPPORTED_VERSIONS.join(', '),
    'X-Latest-Version': SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]
  });

  // Add deprecation warning for older versions
  if (!req.isLatestVersion) {
    res.set('X-API-Deprecation-Warning', `API version ${requestedVersion} is deprecated. Please upgrade to ${SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]}`);
  }

  next();
}

/**
 * Version-specific route handler
 * Usage: versionHandler({ v1: handlerV1, v2: handlerV2 })
 */
const versionHandler = (handlers) => {
  return (req, res, next) => {
    const version = req.apiVersion || DEFAULT_VERSION;
    const handler = handlers[version];
    
    if (!handler) {
      const errorResponse = APIResponse.error(
        `No handler available for API version '${version}'`,
        [{ field: 'version', message: 'Handler not implemented for this version' }]
      );
      return errorResponse.send(res, HTTP_STATUS.NOT_FOUND);
    }
    
    return handler(req, res, next);
  };
};

/**
 * Backward compatibility helper
 * Transforms new response format to old format for older API versions
 */
const backwardCompatibility = (req, res, next) => {
  if (req.apiVersion === 'v1') {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method for v1 compatibility
    res.json = function(data) {
      // Transform v2 format to v1 format if needed
      if (data && typeof data === 'object' && data.success !== undefined) {
        // Keep new format as is - it's already standardized
        return originalJson.call(this, data);
      }
      
      // Wrap raw data in standard format
      const wrappedData = APIResponse.success(data);
      return originalJson.call(this, wrappedData);
    };
  }
  
  next();
};

/**
 * API Documentation helper
 */
const getVersionInfo = () => {
  return {
    supportedVersions: SUPPORTED_VERSIONS,
    defaultVersion: DEFAULT_VERSION,
    latestVersion: SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1],
    versioningMethods: [
      'Header: X-API-Version',
      'Query Parameter: ?version=v1',
      'URL Path: /api/v1/',
      'Accept Header: application/vnd.api+json;version=1'
    ]
  };
};

module.exports = apiVersioning;
module.exports.versionHandler = versionHandler;
module.exports.backwardCompatibility = backwardCompatibility;
module.exports.extractVersion = extractVersion;
module.exports.getVersionInfo = getVersionInfo;
module.exports.SUPPORTED_VERSIONS = SUPPORTED_VERSIONS;
module.exports.DEFAULT_VERSION = DEFAULT_VERSION;