import { z } from 'zod';

export function createUserSchema() {
	const changeEmail = z.email();

	const changePassword = z.object({
		password: z
			.string()
			.min(8)
			.max(20)
			.refine((password) => /[A-Z]/.test(password))
			.refine((password) => /[a-z]/.test(password))
			.refine((password) => /[0-9]/.test(password))
			.refine((password) => /[!@#$%^&*]/.test(password))
	});

	const disable = z.boolean();

	return {
		changeEmail,
		changePassword,
		disable
	};
}
