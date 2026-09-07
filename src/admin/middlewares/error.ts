import { AppError } from '@utils/error.js';
import type { NextFunction, Request, Response } from 'express';
import { FirebaseAuthError, AuthClientErrorCode } from 'firebase-admin/auth';
import { logger } from 'firebase-functions/logger';
import { number, ZodError } from 'zod';

type ErrorTypes = FirebaseAuthError | AppError;

export function errorHandler(
	err: ErrorTypes,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	let [code, statusCode, message]: [string, number, string] = [
		'internal',
		500,
		'Something went wrong on our end. Please try again.'
	];

	let firebaseAuthError;
	let zodError;

	logger.log(err);

	if (err instanceof FirebaseAuthError) {
		firebaseAuthError = firebaseErrorHandler(err);
		statusCode = firebaseAuthError.statusCode;
		message = firebaseAuthError.message;
		code = firebaseAuthError.code;
	}

	if (err instanceof AppError) {
		statusCode = 400;
		message = err.message;
		code = 'app_error';
	}

	if (err instanceof ZodError) {
		zodError = zodErrorHandler(err);
		statusCode = zodError.statusCode;
		message = zodError.message;
		code = zodError.code;
	}

	return res.status(statusCode).send({ message, code });
}

function zodErrorHandler(err: ZodError): {
	code: string;
	message: string;
	statusCode: number;
} {
	let message: string,
		statusCode: number = 422,
		code = 'invalid_input';

	switch (err.issues[0].code) {
		case 'too_small':
			message = 'The provided parameter was too small';
			code = 'too_small';
			break;

		default:
			message = 'The provided value is invalid';
			statusCode = 404;
			break;
	}

	return {
		statusCode,
		code,
		message
	};
}

function firebaseErrorHandler(err: FirebaseAuthError): {
	code: string;
	message: string;
	statusCode: number;
} {
	let message: string,
		code: string = 'invalid',
		statusCode: number = 400;

	const firebaseErrorCode = err.code.split('/')[1];

	switch (firebaseErrorCode) {
		case AuthClientErrorCode.ID_TOKEN_EXPIRED.code:
			message = 'The provided ID token has expired.';
			code = 'token_revoked';
			statusCode = 403;
			break;
		case AuthClientErrorCode.INVALID_ID_TOKEN.code:
			message = 'The provided ID token is invalid.';
			code = 'token_invalid';
			statusCode = 403;
			break;

		case AuthClientErrorCode.USER_NOT_FOUND.code:
			message = 'We could not find the specified ID in our records.';
			code = 'user_not_found';
			statusCode = 404;
			break;
		default:
			message = 'Something went wrong, Please try again.';
			code = 'bad_request';
			statusCode = 404;
			break;
	}

	logger.error('code', code);
	logger.error('message', message);

	return {
		message,
		code,
		statusCode
	};
}
