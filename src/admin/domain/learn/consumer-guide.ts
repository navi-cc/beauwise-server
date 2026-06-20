export interface ConsumerGuide {
	readonly id: string;
	name: string;
	image_source: string;
	definition: string;
	usage: string;
	sources: Array<string>;
	is_deleted: boolean;
}

export interface ConsumerGuideInstance {
	update(updatedMythFact: ConsumerGuide): void;
	get(): ConsumerGuide;
}

export function createConsumerGuideInstance(data: ConsumerGuide): ConsumerGuideInstance {
	let consumerGuide: ConsumerGuide = {
		...data
	};

	const update = (updatedMythFact: ConsumerGuide) => {
		consumerGuide = {
			...updatedMythFact
		};
	};

	const get = (): ConsumerGuide => ({
		...consumerGuide
	});

	return {
		update,
		get
	};
}
