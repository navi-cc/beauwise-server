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

	const status = z
		.string()
		.refine(
			(val) =>
				val === 'REMOVE_PENDING_DELETION' ||
				val === 'PENDING_DELETION' ||
				val === 'ACTIVE' ||
				val === 'DISABLED'
		);

	const role = z.string().refine((val) => val === 'admin' || val === 'basic');
	const ALLOWED_DOMAINS = ['beauwise.tech', 'gmail.com'];
	const newUser = z.object({
		email: z.email().refine(
			(email) => {
				const domain = email.split('@')[1]?.toLowerCase();
				return ALLOWED_DOMAINS.includes(domain);
			},
			{
				message: `Email must belong to an authorized domain: ${ALLOWED_DOMAINS.join(', ')}`
			}
		),
		password: z
			.string()
			.min(8)
			.max(20)
			.refine((password) => /[A-Z]/.test(password))
			.refine((password) => /[a-z]/.test(password))
			.refine((password) => /[0-9]/.test(password))
			.refine((password) => /[!@#$%^&*]/.test(password))
	});

	return {
		changeEmail,
		changePassword,
		status,
		newUser,
		role
	};
}
