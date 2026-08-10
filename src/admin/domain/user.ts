export type AccountStatus =
	| 'PENDING_DELETION'
	| 'ACTIVE'
	| 'DISABLED'
	| 'REMOVE_PENDING_DELETION';

export interface User {
	readonly id: string;
	email: string;
	password: string;
	status: AccountStatus;
	customClaims: {
		[key: string]: string[] | string;
	};
}

export interface UserInstance {
	getValues(): User;
	changeEmail(newEmail: string): void;
	changePassword(newPassword: string): void;
	toggleStatus(status: AccountStatus): void;
	addRole(role: string): void;
	removeRole(role: string): void;
}

function createUserInstance(data: User): UserInstance {
	const user: User = {
		...data,
		customClaims: {
			roles: data.customClaims.roles ?? ''
		}
	};

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

		if (user.customClaims?.roles) {
			user.customClaims.roles = role;
		}
	};

	const removeRole = (removedRole: string) => {
		if (!user.customClaims.roles.includes(removedRole)) {
			throw new Error("The role doesn't exist");
		}

		user.customClaims.roles = '';
	};

	const toggleStatus = (status: AccountStatus) => {
		user.status = status;
	};

	const getValues = (): User => ({
		...user,
		customClaims: {
			roles: user.customClaims.roles
		}
	});

	return {
		getValues,
		changeEmail,
		changePassword,
		toggleStatus,
		addRole,
		removeRole
	};
}

export { createUserInstance };
