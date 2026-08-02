export type BaseEmailProvider = {
	send: (hostEmail: string, email: string, html: string) => Promise<void>;
};

export function createEmailService(emailProvider: BaseEmailProvider) {
	const hostEmail = 'no-reply@beauwise.tech';

	const send = async (email: string, code: string, emailType = 'email_verification') => {
		const html =
			emailType === 'email_verification'
				? getEmailVerificationTemplate(code, 10)
				: getPasswordResetTemplate(code, 10);

		await emailProvider.send(hostEmail, email, html);
	};

	return { send };
}

function getPasswordResetTemplate(code: string, codeExpiration: number) {
	return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
	<head>
		<link
			rel="preload"
			as="image"
			href="https://storage.googleapis.com/beauwise-1687a.firebasestorage.app/logo.png"
		/>
		<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
		<meta name="x-apple-disable-message-reformatting" />
	</head>
	<body dir="ltr" lang="en" style="margin: 0; padding: 0">
		<!--$--><!--html--><!--head--><!--body-->
		<table
			border="0"
			width="100%"
			cellpadding="0"
			cellspacing="0"
			role="presentation"
			align="center"
		>
			<tbody>
				<tr>
					<td dir="ltr" lang="en" style="padding: 0; margin: 0; flex: 1">
						<img
							alt="BeauWise Logo"
							src="https://storage.googleapis.com/beauwise-1687a.firebasestorage.app/logo.png"
							style="
								display: block;
								outline: none;
								border: none;
								text-decoration: none;
								width: 50px;
								margin-left: auto;
								margin-right: auto;
								margin-block: 20px;
							"
						/>
						<table
							align="center"
							width="100%"
							border="0"
							cellpadding="0"
							cellspacing="0"
							role="presentation"
							style="max-width: 37.5em; padding-inline: 10px; padding-block: 10px"
						>
							<tbody>
								<tr style="width: 100%">
									<td>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="max-width: 37.5em"
										>
											<tbody>
												<tr style="width: 100%">
													<td>
														<p
															style="
																font-size: 6px;
																line-height: 24px;
																font-family: system-ui;
																margin-top: 0;
																margin-bottom: 0;
															"
														>
															Hi!
														</p>
														<p
															style="
																font-size: 6px;
																line-height: 12px;
																font-family: system-ui;
																margin-top: 0;
																margin-bottom: 0;
															"
														>
															We received a request to reset the password for your account. 
															Use the verification code below to complete your reset:
														</p>
													</td>
												</tr>
											</tbody>
										</table>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="
												max-width: 37.5em;
												margin-top: 8px;
												width: max-content;
												padding-inline: 10px;
											"
										>
											<tbody>
												<tr style="width: 100%">
													<td>
														<p
															style="
																font-size: 6px;
																line-height: 24px;
																font-weight: bolder;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
																letter-spacing: 4px;
															"
														>
															${code}
														</p>
													</td>
												</tr>
											</tbody>
										</table>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="max-width: 37.5em; margin-top: 40px"
										>
											<tbody>
												<tr style="width: 100%">
													<td>
														<p
															style="
																font-size: 6px;
																line-height: 24px;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
															"
														>
															This code will expire in ${codeExpiration}
															minutes.
														</p>
														<p
															style="
																font-size: 6px;
																line-height: 12px;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
															"
														>
															If you did not ask to reset your password, you can
															safely ignore this email.
														</p>
													</td>
												</tr>
											</tbody>
										</table>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="max-width: 37.5em; margin-top: 20px"
										>
											<tbody>
												<tr style="width: 100%">
													<td>
														<p
															style="
																font-size: 6px;
																line-height: 24px;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
															"
														>
															Best regards,
														</p>
														<p
															style="
																font-size: 6px;
																line-height: 12px;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
															"
														>
															The BeauWise Team
														</p>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
						<table
							align="center"
							width="100%"
							border="0"
							cellpadding="0"
							cellspacing="0"
							role="presentation"
							style="
								max-width: 37.5em;
								width: 100%;
								background-color: #8b78ff;
								margin: 0;
								margin-top: 40px;
								border-radius: 4px;
							"
						>
							<tbody>
								<tr style="width: 100%">
									<td style="padding: 12px">
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
										>
											<tbody>
												<tr>
													<td>
														<table>
															<tr>
																<td>
																	<p
																		style="
																			font-size: 6px;
																			margin-top: 0;
																			margin-bottom: 0;
																			font-family: system-ui;
																			color: #fff;
																		"
																	>
																		Need assistance?
																	</p>
																	<p
																		style="
																			font-size: 6px;
																			margin-top: 0;
																			margin-bottom: 0;
																			font-family: system-ui;
																			color: #fff;
																		"
																	>
																		Reach out to us at support@beauwise.tech
																	</p>
																</td>
															</tr>
															<tr>
																<td>
																	<p
																		style="
																			font-size: 6px;
																			margin-top: 0;
																			margin-bottom: 0;
																			font-family: system-ui;
																			color: #fff;
																		"
																	>
																		© 2026 RISE Inc. All rights reserved.
																	</p>
																</td>
															</tr>
														</table>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
		<!--/$-->
	</body>
</html>
`;
}

function getEmailVerificationTemplate(code: string, codeExpiration: number) {
	return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
	<head>
		<link
			rel="preload"
			as="image"
			href="https://storage.googleapis.com/beauwise-1687a.firebasestorage.app/logo.png"
		/>
		<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
		<meta name="x-apple-disable-message-reformatting" />
	</head>
	<body dir="ltr" lang="en" style="margin: 0; padding: 0">
		<!--$--><!--html--><!--head--><!--body-->
		<table
			border="0"
			width="100%"
			cellpadding="0"
			cellspacing="0"
			role="presentation"
			align="center"
		>
			<tbody>
				<tr>
					<td dir="ltr" lang="en" style="padding: 0; margin: 0; flex: 1">
						<img
							alt="BeauWise Logo"
							src="https://storage.googleapis.com/beauwise-1687a.firebasestorage.app/logo.png"
							style="
								display: block;
								outline: none;
								border: none;
								text-decoration: none;
								width: 50px;
								margin-left: auto;
								margin-right: auto;
								margin-block: 20px;
							"
						/>
						<table
							align="center"
							width="100%"
							border="0"
							cellpadding="0"
							cellspacing="0"
							role="presentation"
							style="max-width: 37.5em; padding-inline: 10px; padding-block: 10px"
						>
							<tbody>
								<tr style="width: 100%">
									<td>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="max-width: 37.5em"
										>
											<tbody>
												<tr style="width: 100%">
													<td>
														<p
															style="
																font-size: 6px;
																line-height: 24px;
																font-family: system-ui;
																margin-top: 0;
																margin-bottom: 0;
															"
														>
															Hi!
														</p>
														<p
															style="
																font-size: 6px;
																line-height: 12px;
																font-family: system-ui;
																margin-top: 0;
																margin-bottom: 0;
															"
														>
															Thank you for using for BeauWise. To complete your
															action, please enter the
															following code:
														</p>
													</td>
												</tr>
											</tbody>
										</table>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="
												max-width: 37.5em;
												margin-top: 8px;
												width: max-content;
												padding-inline: 10px;
											"
										>
											<tbody>
												<tr style="width: 100%">
													<td>
														<p
															style="
																font-size: 6px;
																line-height: 24px;
																font-weight: bolder;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
																letter-spacing: 4px;
															"
														>
															${code}
														</p>
													</td>
												</tr>
											</tbody>
										</table>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="max-width: 37.5em; margin-top: 40px"
										>
											<tbody>
												<tr style="width: 100%">
													<td>
														<p
															style="
																font-size: 6px;
																line-height: 24px;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
															"
														>
															This code will expire in ${codeExpiration}
															minutes.
														</p>
														<p
															style="
																font-size: 6px;
																line-height: 12px;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
															"
														>
															If you did not request a verification code, you can
															safely ignore this email.
														</p>
													</td>
												</tr>
											</tbody>
										</table>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="max-width: 37.5em; margin-top: 20px"
										>
											<tbody>
												<tr style="width: 100%">
													<td>
														<p
															style="
																font-size: 6px;
																line-height: 24px;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
															"
														>
															Best regards,
														</p>
														<p
															style="
																font-size: 6px;
																line-height: 12px;
																margin-top: 0;
																margin-bottom: 0;
																font-family: system-ui;
															"
														>
															The BeauWise Team
														</p>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
						<table
							align="center"
							width="100%"
							border="0"
							cellpadding="0"
							cellspacing="0"
							role="presentation"
							style="
								max-width: 37.5em;
								width: 100%;
								background-color: #8b78ff;
								margin: 0;
								margin-top: 40px;
								border-radius: 4px;
							"
						>
							<tbody>
								<tr style="width: 100%">
									<td style="padding: 12px">
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
										>
											<tbody>
												<tr>
													<td>
														<table>
															<tr>
																<td>
																	<p
																		style="
																			font-size: 6px;
																			margin-top: 0;
																			margin-bottom: 0;
																			font-family: system-ui;
																			color: #fff;
																		"
																	>
																		Need assistance?
																	</p>
																	<p
																		style="
																			font-size: 6px;
																			margin-top: 0;
																			margin-bottom: 0;
																			font-family: system-ui;
																			color: #fff;
																		"
																	>
																		Reach out to us at support@beauwise.tech
																	</p>
																</td>
															</tr>
															<tr>
																<td>
																	<p
																		style="
																			font-size: 6px;
																			margin-top: 0;
																			margin-bottom: 0;
																			font-family: system-ui;
																			color: #fff;
																		"
																	>
																		© 2026 RISE Inc. All rights reserved.
																	</p>
																</td>
															</tr>
														</table>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
		<!--/$-->
	</body>
</html>
`;
}
