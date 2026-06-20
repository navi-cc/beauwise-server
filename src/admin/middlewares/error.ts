import { AppError } from '@utils/error.js';
import type { NextFunction, Request, Response } from 'express';
import { FirebaseAuthError, AuthClientErrorCode } from 'firebase-admin/auth';
import { ZodError } from 'zod';

type ErrorTypes = FirebaseAuthError | AppError;

export function errorHandler(
	err: ErrorTypes,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	let [code, message]: [number, string] = [500, 'Something went wrong on our end.'];

	if (err instanceof FirebaseAuthError) {
		[code, message] = firebaseErrorHandler(err);
	}

	if (err instanceof AppError) {
		[code, message] = [err.code, err.message];
	}

	if (err instanceof ZodError) {
		[code, message] = zodErrorHandler(err);
	}

	return res.status(code).send(message);
}

function zodErrorHandler(err: ZodError): [number, string] {
	let message: string,
		code: number = 422;

	switch (err.issues[0].code) {
		case 'too_small':
			message = 'The provided parameter was too small';
			break;

		default:
			message = 'Invalid input.';
			code = 404;
			break;
	}

	return [code, message + ' ' + 'Please try again.'];
}

function firebaseErrorHandler(err: FirebaseAuthError): [number, string] {
	let message: string,
		code: number = 400;

	const firebaseErrorCode = err.code.split('/')[1];

	switch (firebaseErrorCode) {
		case AuthClientErrorCode.ID_TOKEN_EXPIRED.code:
			message = 'The provided ID token has expired.';
			break;
		case AuthClientErrorCode.INVALID_ID_TOKEN.code:
			message = 'The provided ID token is invalid.';
			break;

		case AuthClientErrorCode.USER_NOT_FOUND.code:
			message = 'We could not find the specified ID in our records.';

			break;
		default:
			message = 'Something went wrong,';
			code = 404;
			break;
	}

	return [code, message + ' ' + 'Please try again.'];
}
