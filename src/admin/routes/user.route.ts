import express from 'express';
import { createUserController } from '@controller/user-controller.js';
import { createUserSchema } from '@zod/user-schema.js';
import { createUserService } from '@services/user-service.js';
import { createUserRepository } from '@repo/user-repository.js';
import { createUserQuery } from '@query/user-query.js';
import { validate } from '@middleware/validate.js';
import { authorize } from '@middleware/auth.js';

const userRouter = express.Router();

const userRepository = createUserRepository();
const userQuery = createUserQuery(userRepository);
const userService = createUserService(userRepository);
const userController = createUserController(userService);
const userSchema = createUserSchema();

userRouter.get(
	'/',
	authorize(['superadmin', 'admin'], 'read:users', userQuery),
	userController.getUsers(userQuery)
);

userRouter.post(
	'/',
	validate(userSchema.newUser),
	authorize(['superadmin', 'admin'], 'create:users', userQuery),
	userController.addUser
);

userRouter.post(
	'/admin',
	validate(userSchema.newUser),
	authorize(['superadmin'], 'create:adminUsers', userQuery),
	userController.addUserAdmin
);

userRouter.delete(
	'/admin/:id',
	authorize(['superadmin'], 'delete:adminUsers', userQuery),
	userController.deleteUserAdmin(userQuery)
);

userRouter.delete(
	'/:id',
	authorize(['superadmin', 'admin'], 'delete:users', userQuery),
	userController.deleteUser(userQuery)
);

userRouter.patch(
	'/:id/email',
	validate(userSchema.changeEmail),
	authorize(['superadmin', 'admin'], 'update:users', userQuery),
	userController.changeUserEmail
);

userRouter.patch(
	'/:id/password',
	validate(userSchema.changePassword),
	authorize(['superadmin'], 'update:adminUsers', userQuery),
	userController.changeUserPassword
);

userRouter.patch(
	'/:id/disable',
	validate(userSchema.status),
	authorize(['superadmin, admin'], 'update:users', userQuery),
	userController.changeUserStatus
);

userRouter.patch(
	'/admin/:id/status',
	validate(userSchema.status),
	authorize(['superadmin'], 'update:adminUsers', userQuery),
	userController.changeAdminUserStatus
);

userRouter.patch(
	'/:id/role',
	validate(userSchema.status),
	authorize(['superadmin'], 'update:adminUsers', userQuery),
	userController.changeUserRole
);

userRouter.patch(
	'/:id/status',
	validate(userSchema.status),
	authorize(['superadmin', 'admin'], 'update:users', userQuery),
	userController.changeUserStatus
);

userRouter.patch(
	'/:id/status',
	validate(userSchema.status),
	authorize('admin', userQuery),
	userController.changeUserStatus
);

// userRouter.patch(
// 	'/:id/email',
// 	validate(userSchema.changeEmail),
// 	authorize('admin', userQuery),
// 	userController.changeUserEmail
// );

// userRouter.patch(
// 	'/:id/password',
// 	validate(userSchema.changePassword),
// 	authorize('admin', userQuery),
// 	userController.changeUserPassword
// );

// userRouter.patch(
// 	'/:id/disable',
// 	validate(userSchema.disable),
// 	authorize('admin', userQuery),
// 	userController.disableUser
// );

export { userRouter, userQuery };
