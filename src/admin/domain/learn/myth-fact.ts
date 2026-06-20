export interface MythFact {
	readonly id: string;
	name: string;
	image_source: string;
	topics: Array<{
		[key: string]: string;
	}>;
	sources: Array<string>;
	is_deleted: boolean;
}

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
			topics: [...data.topics]
		};
	};

	const get = (): MythFact => ({
		...mythFact,
		topics: [...data.topics]
	});

	return {
		update,
		get
	};
}
