import { beforeEach, describe, expect, test, vi } from 'vitest';
import { authenticate, authorize } from '@middleware/auth.js';
import { auth } from '../config.js';
import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { AppError } from '@utils/error.js';

import type { UserQuery } from '@query/user-query.js';

vi.mock(import('@src/admin/config.js'), () => {
	return {
		auth: {
			verifyIdToken: vi.fn()
		}
	} as unknown as typeof import('@src/admin/config.js');
});

describe('auth middleware', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockRequest = {
			headers: {
				authorization: ''
			}
		};
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
			sendStatus: vi.fn()
		};
		mockNext = vi.fn();
	});
	describe('authentication', () => {
		test('should call the next function or handler if the token is considered as valid by firebase auth', async () => {
			const mockVerifyIdToken = vi.mocked(auth.verifyIdToken);

			mockRequest = {
				headers: {
					authorization: 'Bearer this_should_be_a_jwt_token'
				}
			};

			mockVerifyIdToken.mockResolvedValue({
				email: 'foobar@gmail.com',
				uid: 'foobar123'
			} as DecodedIdToken);

			await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});

		test('should call the error handler if the token is not considered as valid by firebase auth', async () => {
			const mockVerifyIdToken = vi.mocked(auth.verifyIdToken);

			const mockErrorFirebase = new AppError('Invalid', 403);
			mockRequest = {
				headers: {
					authorization: 'Bearer this_should_be_a_jwt_token'
				}
			};

			mockVerifyIdToken.mockRejectedValue(mockErrorFirebase);

			await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});

		test('should call the error handler if the authorization header is not provided', async () => {
			mockRequest = {
				headers: {
					authorization: ''
				}
			};

			await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});

		test('should call the error handler if the provided token in authorization header is invalid', async () => {
			mockRequest = {
				headers: {
					authorization: 'this is a bad token'
				}
			};

			await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
		});
	});

	describe('authorization', () => {
		test("should call next function if user's role is allowed to do the operation", async () => {
			mockResponse = {
				locals: {
					id: 'mock-id=token'
				}
			};

			const mockCreateUserQuery = vi.fn(() => {
				const getValues = () => {
					return {
						customClaims: {
							roles: ['admin']
						}
					};
				};

				const getUser = () => ({
					getValues
				});

				return {
					getUser
				};
			});

			const mockUserQuery = mockCreateUserQuery();
			const route = authorize('admin', mockUserQuery as unknown as UserQuery);

			mockRequest = {
				params: {
					id: 'this_should_be_a_user_id'
				}
			};

			await route(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});

		test("should not call next function if user's role is not allowed to do the operation", async () => {
			mockResponse = {
				locals: {
					id: 'mock-id=token'
				},

				sendStatus: vi.fn()
			};

			const mockCreateUserQuery = vi.fn(() => {
				const getValues = () => {
					return {
						customClaims: {
							roles: ['not_allowed_role']
						}
					};
				};

				const getUser = () => ({
					getValues
				});

				return {
					getUser
				};
			});

			const mockUserQuery = mockCreateUserQuery();
			const route = authorize('admin', mockUserQuery as unknown as UserQuery);

			mockRequest = {
				params: {
					id: 'this_should_be_a_user_id'
				}
			};

			await route(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).not.toHaveBeenCalled();
		});
	});
});
