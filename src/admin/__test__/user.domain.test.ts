import { beforeEach, describe, expect, test } from 'vitest';

import { createUserInstance, type User } from '@domain/user.js';

describe('user domain', () => {
	let mockUserData: User;

	beforeEach(() => {
		mockUserData = {
			id: 'foobar_id_123',
			email: 'foobar@gmail.com',
			password: 'foobar123',
			disabled: false,
			customClaims: {
				roles: ['admin'],
				permissions: ['read:documents', 'write:documents', 'delete:documents']
			}
		};
	});

	describe('user role related updates', () => {
		test('should add new user role.', () => {
			const mockNewRole = 'moderator';
			const user = createUserInstance(mockUserData);

			user.addRole(mockNewRole);

			const userRoles = user.getValues().customClaims.roles;

			expect(userRoles).toContain(mockNewRole);
		});

		test('should remove user role.', () => {
			const user = createUserInstance(mockUserData);

			user.removeRole('admin');

			const userRoles = user.getValues().customClaims.roles;

			expect(userRoles).not.toContain('admin');
		});

		test('Should throw an error if the provided role when adding is already added.', () => {
			const user = createUserInstance(mockUserData);

			expect(() => user.addRole('admin')).toThrow();
		});

		test('should throw an error if the provided role when removing does not exists.', () => {
			const user = createUserInstance(mockUserData);

			// Remove the current role first.
			user.removeRole('admin');

			expect(() => user.removeRole('admin')).toThrow();
		});
	});

	describe('user permission related updates', () => {
		test('should add new user permission.', () => {
			const mockPermission = 'update:documents';
			const user = createUserInstance(mockUserData);

			user.addPermission(mockPermission);

			const userPermissions = user.getValues().customClaims.permissions;

			expect(userPermissions).toContain(mockPermission);
		});

		test('should remove user permission.', () => {
			const user = createUserInstance(mockUserData);

			user.removePermission('write:documents');

			const userPermissions = user.getValues().customClaims.permissions;

			expect(userPermissions).not.toContain('write:documents');
		});

		test('Should throw an error if the provided permission when adding is already added.', () => {
			const user = createUserInstance(mockUserData);

			expect(() => user.addPermission('write:documents')).toThrow();
		});

		test('should throw an error if the provided permission when removing does not exists.', () => {
			const user = createUserInstance(mockUserData);

			// Remove the current permission first.
			user.removePermission('write:documents');

			expect(() => user.removePermission('write:documents')).toThrow();
		});
	});
});
