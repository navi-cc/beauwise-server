import crypto, { type BinaryLike } from 'crypto';
import type { OTPServiceType, StorageOTPService } from '@client/types/otp.js';

export function createOtpService(storageOTPService: StorageOTPService) {
	const MAX_ATTEMPTS = 5;
	const OTP_SECRET: string = process.env.OTP_SECRET as string;

	const hashOtp = (code: BinaryLike) => {
		return crypto.createHmac('sha256', OTP_SECRET).update(code).digest('hex');
	};

	const storeAndGenerate = async (
		key: string,
		serviceType: OTPServiceType
	): Promise<string> => {
		const plainOtp = crypto.randomInt(100000, 999999).toString();
		const hashedCode = hashOtp(plainOtp);

		await storageOTPService.save({ key, code: hashedCode, attempts: 0 }, serviceType);

		return plainOtp;
	};

	const verify = async (
		key: string,
		userProvidedCode: string,
		serviceType: OTPServiceType
	) => {
		const otpRecord = await storageOTPService.get(key, serviceType);

		if (!otpRecord) {
			return { success: false, message: 'The OTP has expired.' };
		}

		if (otpRecord.attempts >= MAX_ATTEMPTS) {
			await storageOTPService.remove(key, serviceType);

			return {
				success: false,
				message: 'Too many failed attempts. Please request a new one.'
			};
		}

		const userProvidedHashedCode = hashOtp(userProvidedCode);

		const isValid = crypto.timingSafeEqual(
			Buffer.from(otpRecord.code),
			Buffer.from(userProvidedHashedCode)
		);

		if (isValid) {
			await storageOTPService.remove(key, serviceType);
			return { success: true, message: 'The code is successfully verified.' };
		} else {
			otpRecord.attempts = ++otpRecord.attempts;

			await storageOTPService.update(otpRecord, serviceType);
			return { success: false, message: 'Invalid code. Please try again.' };
		}
	};

	return {
		storeAndGenerate,
		verify
	};
}
