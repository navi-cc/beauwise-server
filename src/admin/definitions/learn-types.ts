import {
	type ConsumerGuide,
	type ConsumerGuideInstance
} from '@domain/learn/consumer-guide.js';
import { type Ingredient, type IngredientInstance } from '@domain/learn/ingredient.js';
import { type MythFact, type MythFactInstance } from '@domain/learn/myth-fact.js';

export type LearnItem = ConsumerGuide | Ingredient | MythFact;

export type BaseLearnItemInstace<T> = {
	update(item: T): void;
	get(): T;
};

export type LearnItemInstance =
	| ConsumerGuideInstance
	| IngredientInstance
	| MythFactInstance;

export type LearnRepository<TLearnItem, TItemInstance> = {
	save(id: string, item: TLearnItem, collectionPath: string): Promise<void>;
	add(item: TLearnItem, collectionPath: string): Promise<void>;
	findById(id: string, collectionPath: string): Promise<TItemInstance>;
};

export type LearnService<TLearnItem> = {
	updateItem(
		itemId: string,
		updatedItem: TLearnItem,
		collectionPath: string
	): Promise<TLearnItem>;
	addItem(newItem: TLearnItem, collectionPath: string): Promise<void>;
};
