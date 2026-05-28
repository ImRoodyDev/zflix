import { Model, ModelStatic } from 'sequelize';

/** Hydrates a plain object into a Sequelize model instance without saving it to the database.
 *
 * @param model - The Sequelize model class to instantiate.
 * @param plain - The plain object containing the model's attributes.
 * @returns An instance of the specified Sequelize model populated with the provided attributes.
 */
// export const hydrateModel = <T extends Model>(model: ModelStatic<T>, plain: Record<string, unknown>): T => model.build(plain as T['_creationAttributes'], { isNewRecord: false });
export const hydrateModel = <T extends Model>(model: ModelStatic<T>, plain: Record<string, unknown>): T => {
	if (!plain || typeof plain !== 'object') {
		throw new Error('Invalid plain object provided to hydrateModel');
	}

	// Create a sanitized copy, removing undefined/null values that might cause issues with Sequelize
	const sanitized: Record<string, unknown> = {};
	for (const key in plain) {
		if (Object.prototype.hasOwnProperty.call(plain, key) && plain[key] !== undefined && plain[key] !== null) {
			sanitized[key] = plain[key];
		}
	}

	// Build instance with sanitized data
	// The isNewRecord: false option tells Sequelize this represents an existing database record
	return model.build(sanitized as T['_creationAttributes'], { isNewRecord: false });
};
