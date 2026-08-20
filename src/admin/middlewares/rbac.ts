const documentPermissions = [
	'create:documents',
	'read:documents',
	'update:documents',
	'delete:documents'
] as const;

const manageUsersPermissions = [
	'create:users',
	'read:users',
	'update:users',
	'delete:users'
] as const;

const manageAdminsPermissions = [
	'create:adminUsers',
	'read:adminUsers',
	'update:adminUsers',
	'delete:adminUsers'
] as const;

export type ManageAdminPermissions = (typeof manageAdminsPermissions)[number];
export type ManageUsersPermissions = (typeof manageUsersPermissions)[number];
export type DocumentPermissions = (typeof documentPermissions)[number];

export const roles = {
	superadmin: [
		...documentPermissions,
		...manageUsersPermissions,
		...manageAdminsPermissions
	],

	admin: [...documentPermissions, ...manageUsersPermissions]
};
