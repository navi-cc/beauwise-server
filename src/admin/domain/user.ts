export interface User {
	readonly id: string;
	email: string;
	password: string;
	disabled: boolean;
	customClaims: {
		[key: string]: Array<string>;
	};
}

export interface UserInstance {
	getValues(): User;
	changeEmail(newEmail: string): void;
	changePassword(newPassword: string): void;
	toggleDisable(status: boolean): void;
	addRole(role: string): void;
	removeRole(role: string): void;
	addPermission(permission: string): void;
	removePermission(permission: string): void;
}

function createUserInstance(data: User): UserInstance {
	const user: User = { ...data };

	const changeEmail = (newEmail: string) => {
		user.email = newEmail;
	};

	const changePassword = (newPassword: string) => {
		user.password = newPassword;
	};

	const addRole = (role: string) => {
		if (user.customClaims.roles.includes(role)) {
			throw new Error('The role is already added.');
		}

		user.customClaims.roles = [...user.customClaims.roles, role];
	};

	const removeRole = (removedRole: string) => {
		if (!user.customClaims.roles.includes(removedRole)) {
			throw new Error("The role doesn't exist");
		}

		user.customClaims.roles = user.customClaims.roles.filter(
			(role: string) => role !== removedRole
		);
	};

	const addPermission = (permission: string) => {
		if (user.customClaims.permissions.includes(permission)) {
			throw new Error('The provided permission is already added.');
		}

		user.customClaims.permissions = [...user.customClaims.permissions, permission];
	};

	const removePermission = (removedPermission: string) => {
		if (!user.customClaims.permissions.includes(removedPermission)) {
			throw new Error("The permission doesn't exist");
		}

		user.customClaims.permissions = user.customClaims.permissions.filter(
			(permission: string) => permission !== removedPermission
		);
	};

	const toggleDisable = (status: boolean) => {
		user.disabled = status;
	};

	const getValues = (): User => ({
		...user,
		customClaims: {
			permissions: [...user.customClaims.permissions],
			roles: [...user.customClaims.roles]
		}
	});

	return {
		getValues,
		changeEmail,
		changePassword,
		toggleDisable,
		addRole,
		removeRole,
		addPermission,
		removePermission
	};
}

export { createUserInstance };
