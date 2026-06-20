import { z } from 'zod';

export function createLearnSchema() {
	const id = z.string();

	const ingredient = z.object({
		id,
		name: z.coerce.string(),
		categories: z.array(z.string()),
		what_it_does: z.array(z.string()),
		what_it_is: z.coerce.string().min(10),
		best_for: z.array(z.string()),
		common_products: z.array(z.string()),
		sources: z.array(z.string()),
		safety_level: z.coerce.string().min(10),
		is_deleted: z.coerce.boolean()
	});

	const mythFact = z.object({
		id,
		name: z.string(),
		image_source: z.string(),
		topics: z.array(z.any()),
		sources: z.array(z.string()),
		is_deleted: z.coerce.boolean()
	});

	const consumerGuide = z.object({
		id,
		name: z.string(),
		image_source: z.string(),
		definition: z.string(),
		usage: z.string(),
		sources: z.array(z.string()),
		is_deleted: z.coerce.boolean()
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
