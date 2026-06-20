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

userRouter.get('/', authorize('admin', userQuery), userController.getUsers(userQuery));

userRouter.patch(
	'/:id/email',
	validate(userSchema.changeEmail),
	authorize('admin', userQuery),
	userController.changeUserEmail
);

userRouter.patch(
	'/:id/password',
	validate(userSchema.changePassword),
	authorize('admin', userQuery),
	userController.changeUserPassword
);

userRouter.patch(
	'/:id/disable',
	validate(userSchema.disable),
	authorize('admin', userQuery),
	userController.disableUser
);

export { userRouter, userQuery };
