import { z } from 'zod';

const sourceSchema = z.object({
	link: z.url('Must be a valid URL'),
	name: z.string().min(1, 'Source name is required')
});

const mythFactTopicSchema = z.object({
	topic: z.string().min(1, 'Topic is required'),
	fact: z.string().min(1, 'Fact is required'),
	myth: z.string().min(1, 'Myth is required'),
	imageId: z.string().optional(),
	fileHash: z.string()
});

export const mythFact = z.object({
	name: z.string(),
	topics: z.array(mythFactTopicSchema),
	displayImage: z.object({
		fileHash: z.string()
	}),
	videoGuide: z.object({
		fileHash: z.string()
	}),
	baseImagePath: z.string(),
	sources: z.array(sourceSchema),
	is_deleted: z.coerce.boolean().optional()
});

export type MythFact = z.infer<typeof mythFact> & {
	readonly id: string;
};

export function createLearnSchema() {
	const id = z.string();

	const sourceSchema = z.object({
		link: z.url('Must be a valid URL'),
		name: z.string().min(1, 'Source name is required')
	});

	const mythFactTopicSchema = z.object({
		topic: z.string().min(1, 'Topic is required'),
		fact: z.string().min(1, 'Fact is required'),
		imageId: z.string().optional(),
		myth: z.string().min(1, 'Myth is required'),
		fileHash: z.string()
	});

	const ingredient = z.object({
		name: z.string().min(1, 'Name is required'),
		categories: z.array(z.string()).min(1, 'At least 1 category is required'),
		what_it_does: z
			.array(z.string().min(1, 'Sentence cannot be empty'))
			.min(1, 'At least 1 entry is required'),
		what_it_is: z.string().min(1, 'This is required'),
		best_for: z.array(z.string()).min(1, 'At least 1 is required'),
		info: z.string().optional().default(''),
		common_products: z.array(z.string()).min(1, 'At least 1 common product is required'),
		sources: z.array(sourceSchema).min(1, 'At least 1 source is required'),
		safety_level: z.string().optional().default(''),
		is_deleted: z.coerce.boolean().optional()
	});

	const mythFact = z.object({
		name: z.string(),
		topics: z.array(mythFactTopicSchema),
		displayImage: z.object({
			fileHash: z.string()
		}),
		videoGuide: z.object({
			fileHash: z.string()
		}),
		baseImagePath: z.string(),
		sources: z.array(sourceSchema),
		is_deleted: z.coerce.boolean().optional()
	});

	const consumerGuide = z.object({
		name: z.string(),
		definition: z.string(),
		usage: z.string(),
		imageId: z.string().optional(),
		fileHash: z.string(),
		sources: z.array(sourceSchema),
		is_deleted: z.coerce.boolean().optional()
	});

	const pagination = z.object({
		id,
		pageSize: z.number()
	});

	return {
		ingredient,
		pagination,
		mythFact,
		consumerGuide
	};
}
