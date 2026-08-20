export type AccountStatus =
	| 'PENDING_DELETION'
	| 'ACTIVE'
	| 'DISABLED'
	| 'REMOVE_PENDING_DELETION';

export type CustomClaims = {
	role: string;
	permissions: string[];
};

export interface User {
	readonly id: string;
	email: string;
	password: string;
	status: AccountStatus;
	customClaims: CustomClaims;
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
			role: data.customClaims.role ?? '',
			permissions: [...data.customClaims.permissions]
		}
	};

	const changeEmail = (newEmail: string) => {
		user.email = newEmail;
	};

	const changePassword = (newPassword: string) => {
		user.password = newPassword;
	};

	const addRole = (role: string) => {
		if (user.customClaims.role.includes(role)) {
			throw new Error('The role is already added.');
		}

		if (user.customClaims?.role) {
			user.customClaims.role = role;
		}
	};

	const removeRole = (removedRole: string) => {
		if (!user.customClaims.role.includes(removedRole)) {
			throw new Error("The role doesn't exist");
		}

		user.customClaims.role = '';
	};

	const toggleStatus = (status: AccountStatus) => {
		user.status = status;
	};

	const getValues = (): User => ({
		...user,
		customClaims: {
			role: user.customClaims.role,
			permissions: [...data.customClaims.permissions]
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
