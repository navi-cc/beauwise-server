import { ServerClient } from 'postmark';
import type { BaseEmailProvider } from '@client/services/email.js';

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_KEY as string);

export const postmark = function (): BaseEmailProvider {
	const send = async (hostEmail: string, email: string, html: string) => {
		await postmarkClient.sendEmail({
			From: hostEmail,
			To: email,
			Subject: 'Verification Code',
			HtmlBody: html
		});
	};

	return {
		send
	};
};
