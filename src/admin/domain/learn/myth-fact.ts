import { type MythFact } from '@zod/learn-schema.js';
import { logger } from 'firebase-functions/logger';

export interface MythFactInstance {
	update(updatedMythFact: MythFact): void;
	get(): MythFact;
}

export function createMythFactInstance(data: MythFact): MythFactInstance {
	let mythFact: MythFact = {
		...data,
		topics: [...data.topics]
	};

	const update = (updatedMythFact: MythFact) => {
		mythFact = {
			...updatedMythFact,
			topics: [...updatedMythFact.topics]
		};

		logger.log('domain layer, the data is passed from service layer', data);
		logger.log('domain layer data myth fact', mythFact);
	};

	const get = (): MythFact => ({
		...mythFact,
		topics: [...mythFact.topics]
	});

	return {
		update,
		get
	};
}
