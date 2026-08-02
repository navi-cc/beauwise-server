import { MailerSend, EmailParams } from 'mailersend';
import type { BaseEmailProvider } from '../../services/email.js';

const mailer = new MailerSend({
	apiKey: process.env.MAILER_SEND_API_KEY as string
});

const emailParams = new EmailParams();

export const mailerSend = function (): BaseEmailProvider {
	const send = async (hostEmail: string, email: string, html: string) => {
		emailParams
			.setFrom({ email: hostEmail })
			.setTo([{ email }])
			.setSubject('BeauWise Verification Code')
			.setHtml(html);

		await mailer.email.send(emailParams);
	};

	return {
		send
	};
};
