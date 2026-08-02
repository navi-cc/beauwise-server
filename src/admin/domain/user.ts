export interface User {
	readonly id: string;
	email: string;
	password: string;
	disabled: boolean;
	customClaims: {
		[key: string]: string[] | string;
	};
}

export interface UserInstance {
	getValues(): User;
	changeEmail(newEmail: string): void;
	changePassword(newPassword: string): void;
	toggleDisable(status: boolean): void;
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

	const toggleDisable = (status: boolean) => {
		user.disabled = status;
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
		toggleDisable,
		addRole,
		removeRole
	};
}

export { createUserInstance };
