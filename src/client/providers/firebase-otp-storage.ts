import type { OtpRecord, OTPServiceType, StorageOTPService } from '@client/types/otp.js';
import { db } from '@src/admin/config.js';
import type { WriteResult } from 'firebase-admin/firestore';

export function firebaseOtpStorage(): StorageOTPService {
	const save = async (
		record: OtpRecord,
		serviceType: OTPServiceType
	): Promise<WriteResult> => {
		const reference = db.collection(serviceType);

		const documentReference = reference.doc(record.key);

		return await documentReference.set(record);
	};
	const get = async (key: string, serviceType: OTPServiceType): Promise<OtpRecord> => {
		const reference = db.collection(serviceType);
		const response = await reference.doc(key).get();

		const document = response.data() as OtpRecord;

		return document;
	};
	const remove = async (
		key: string,
		serviceType: OTPServiceType
	): Promise<WriteResult> => {
		const reference = db.collection(serviceType);

		const documentReference = reference.doc(key);

		return await documentReference.delete();
	};
	const update = async (
		record: OtpRecord,
		serviceType: OTPServiceType
	): Promise<WriteResult> => {
		const reference = db.collection(serviceType);

		const documentReference = reference.doc(record.key);

		return await documentReference.update(record);
	};

	return {
		save,
		get,
		remove,
		update
	};
}
