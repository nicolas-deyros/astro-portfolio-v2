/**
 * Base class for all application-level errors.
 * Carries an HTTP status code and a machine-readable code string
 * so catch sites can branch on type without parsing message strings.
 */
export class ApplicationError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number = 500,
		public readonly code: string = 'INTERNAL_ERROR',
		options?: ErrorOptions,
	) {
		super(message, options)
		this.name = this.constructor.name
		// Maintains proper stack trace in V8
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor)
		}
	}
}

/** 401 — Missing or invalid authentication credentials. */
export class UnauthorizedError extends ApplicationError {
	constructor(message = 'Unauthorized', options?: ErrorOptions) {
		super(message, 401, 'UNAUTHORIZED', options)
	}
}

/** 403 — Authenticated but not permitted for this resource. */
export class ForbiddenError extends ApplicationError {
	constructor(message = 'Forbidden', options?: ErrorOptions) {
		super(message, 403, 'FORBIDDEN', options)
	}
}

/** 404 — Requested resource does not exist. */
export class NotFoundError extends ApplicationError {
	constructor(message = 'Not found', options?: ErrorOptions) {
		super(message, 404, 'NOT_FOUND', options)
	}
}

/** 409 — Request conflicts with current server state (e.g. duplicate). */
export class ConflictError extends ApplicationError {
	constructor(message = 'Conflict', options?: ErrorOptions) {
		super(message, 409, 'CONFLICT', options)
	}
}

/** 422 — Syntactically valid but semantically invalid input. */
export class ValidationError extends ApplicationError {
	constructor(message = 'Validation failed', options?: ErrorOptions) {
		super(message, 422, 'VALIDATION_ERROR', options)
	}
}

/** 503 — Downstream service (email, DB) failed. */
export class ExternalServiceError extends ApplicationError {
	constructor(message = 'External service error', options?: ErrorOptions) {
		super(message, 503, 'EXTERNAL_SERVICE_ERROR', options)
	}
}

/**
 * Converts any thrown value into a well-typed ApplicationError.
 * Use this in catch blocks that need to re-throw or inspect the error type.
 */
export function toApplicationError(error: unknown): ApplicationError {
	if (error instanceof ApplicationError) return error
	if (error instanceof Error) {
		return new ApplicationError(error.message, 500, 'INTERNAL_ERROR', { cause: error })
	}
	return new ApplicationError('An unexpected error occurred', 500, 'INTERNAL_ERROR', {
		cause: error,
	})
}

/**
 * Creates a standardized success JSON response.
 */
export function createSuccessResponse(data: Record<string, unknown> = {}, statusCode = 200): Response {
	return new Response(JSON.stringify({ success: true, ...data }), {
		status: statusCode,
		headers: { 'Content-Type': 'application/json' },
	})
}

/**
 * Creates a standardized error JSON response from an unknown error.
 * Implements ISSUE-18 pattern: { success: false, error: { code, message } }
 */
export function createErrorResponse(error: unknown): Response {
	const appError = toApplicationError(error)
	return new Response(
		JSON.stringify({
			success: false,
			error: {
				code: appError.code,
				message: appError.message,
			},
		}),
		{
			status: appError.statusCode,
			headers: { 'Content-Type': 'application/json' },
		}
	)
}
