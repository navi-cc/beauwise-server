export interface Ingredient {
	readonly id: string;
	name: string;
	categories: Array<string>;
	what_it_does: Array<string>;
	what_it_is: string;
	best_for: Array<string>;
	common_products: Array<string>;
	sources: Array<string>;
	safety_level: string;
	is_deleted: boolean;
}

export interface IngredientInstance {
	update(updatedIngredient: Ingredient): void;
	get(): Ingredient;
}

export function createIngredientInstance(data: Ingredient): IngredientInstance {
	let ingredient: Ingredient = {
		...data,
		categories: [...data.categories],
		what_it_does: [...data.what_it_does],
		best_for: [...data.best_for],
		common_products: [...data.common_products],
		sources: [...data.sources]
	};

	const update = (updatedIngredient: Ingredient) => {
		ingredient = {
			...updatedIngredient,
			categories: [...updatedIngredient.categories],
			what_it_does: [...updatedIngredient.what_it_does],
			best_for: [...updatedIngredient.best_for],
			common_products: [...updatedIngredient.common_products],
			sources: [...updatedIngredient.sources]
		};
	};

	const get = (): Ingredient => ({
		...ingredient,
		categories: [...ingredient.categories],
		what_it_does: [...ingredient.what_it_does],
		best_for: [...ingredient.best_for],
		common_products: [...ingredient.common_products],
		sources: [...ingredient.sources]
	});

	return {
		update,
		get
	};
}
