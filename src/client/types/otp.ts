import type { WriteResult } from 'firebase-admin/firestore';

export type OTPServiceType = 'change_email' | 'password_reset' | 'email_verification';
export type OtpRecord = {
	key: string;
	code: string;
	attempts: number;
};

export type StorageOTPService = {
	save: (record: OtpRecord, serviceType: OTPServiceType) => Promise<WriteResult>;
	get: (key: string, serviceType: OTPServiceType) => Promise<OtpRecord>;
	remove: (key: string, serviceType: OTPServiceType) => Promise<WriteResult>;
	update: (record: OtpRecord, serviceType: OTPServiceType) => Promise<WriteResult>;
};
