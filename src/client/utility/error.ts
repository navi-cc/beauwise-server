import { ApiError } from '@google/genai';
import {
	HttpsError,
	type CallableRequest,
	type CallableResponse
} from 'firebase-functions/https';

export function errorHandler(controller: CallableFunction) {
	return async (req: CallableRequest, _: CallableResponse): Promise<any> => {
		try {
			const { results } = await controller(req);

			return { results };
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				console.log(error);
			}

			if (error instanceof ApiError) {
				throw new HttpsError('unavailable', 'Something went wrong please try again.');
			}
		}
	};
}
