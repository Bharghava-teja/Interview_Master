/**
 * Standardized API Response Formatter
 * Free utility for consistent API responses across all endpoints
 */

class APIResponse {
  constructor(success = true, message = '', data = null, errors = null, meta = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    
    if (errors) {
      this.errors = errors;
    }
    
    if (meta) {
      this.meta = meta;
    }
  }

  static success(data = null, message = 'Success', meta = null) {
    return new APIResponse(true, message, data, null, meta);
  }

  static error(message = 'An error occurred', errors = null, data = null) {
    return new APIResponse(false, message, data, errors);
  }

  static validationError(errors, message = 'Validation failed') {
    return new APIResponse(false, message, null, errors);
  }

  static notFound(message = 'Resource not found') {
    return new APIResponse(false, message, null, null);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new APIResponse(false, message, null, null);
  }

  static forbidden(message = 'Access forbidden') {
    return new APIResponse(false, message, null, null);
  }

  static serverError(message = 'Internal server error') {
    return new APIResponse(false, message, null, null);
  }

  // Method to send response with appropriate HTTP status
  send(res, statusCode = 200) {
    return res.status(statusCode).json(this);
  }
}

// HTTP Status Code Constants (free to use)
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Pagination helper (free utility)
const createPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

// Error formatting helper
const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.map(error => ({
      field: error.path || error.field,
      message: error.message,
      value: error.value
    }));
  }
  
  if (errors.errors) {
    // Mongoose validation errors
    return Object.keys(errors.errors).map(key => ({
      field: key,
      message: errors.errors[key].message,
      value: errors.errors[key].value
    }));
  }
  
  return [{ message: errors.message || 'Validation error' }];
};

module.exports = {
  APIResponse,
  HTTP_STATUS,
  createPaginationMeta,
  formatValidationErrors
};