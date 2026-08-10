import type { UserInstance } from '@domain/user.js';
import { type UserRepository } from '@src/admin/repos/user-repository.js';
import { auth, db } from '../config.js';
import { logger } from 'firebase-functions/logger';

export type UserQuery = {
    getUser: (id: string) => Promise<UserInstance>;
    getUsers: (
        maxPage: number,
        nextPageToken: string | undefined,
        pageCount: number | undefined
    ) => Promise<object>;
    deleteUser: (uid: string) => Promise<void>;
};

export function createUserQuery(repository: UserRepository): UserQuery {
    const getUser = async (id: string): Promise<UserInstance> => {
        return await repository.findById(id);
    };

    const getUsers = async (
        maxPage: number,
        nextPageToken: string | undefined,
        pageCount: number | undefined
    ): Promise<object> => {
        // if (nextPageToken === undefined) {
        // 	throw new AppError('Requested page exceeds the maximum available pages.', 400);
        // }

        const MAX_RESULTS = maxPage;
        let currentPageCount;
        let response;
        let userData: any;

        if (nextPageToken) {
            response = await auth.listUsers(MAX_RESULTS, nextPageToken);
        } else {
            response = await auth.listUsers(MAX_RESULTS);
        }

        if (!pageCount) {
            currentPageCount = await auth.listUsers();
        }

        await db.collection("users").get().then((snapshot) => {
            userData = snapshot.docs.map((doc) => (
                {
                    id: doc.id,
                    status: doc.data().status
                }
            ))
        })

        const users = response.users.map(
            ({
                uid,
                email,
                displayName,
                disabled,
                customClaims,
                metadata,
                photoURL,
                providerData
            }) => {
                const status = userData.find((d: any) => d.id === uid)?.status;
                logger.info(status);
                return {
                    id: uid,
                    user_name: displayName,
                    email,
                    account_disable: disabled,
                    account_access: { ...customClaims },
                    metadata,
                    photoURL,
                    providerId: providerData[0].providerId,
                    status: status ?? (disabled ? 'disabled' : 'active')
                };
            }
        );

        nextPageToken = response.pageToken !== undefined ? response.pageToken : undefined;

        // const numberOfUsers = currentPageCount?.users.length ?? 0;
        pageCount = Math.ceil((currentPageCount?.users.length ?? 1) / MAX_RESULTS);
        logger.info(users);

        return { users, nextPageToken, pageCount };
    };

    const deleteUser = async (uid: string) => {
        const userDoc = await db.collection('users').doc(uid).get();

        await auth.deleteUser(uid);
        await db.recursiveDelete(userDoc.ref);
    };

    // const sendPasswordResetLink = async (email: string) => {
    // 	const domain =
    // 		process.env.NODE_ENV === 'development'
    // 			? 'http://http://localhost:5173'
    // 			: 'http://http://localhost:5173';

    // 	const foo = auth.generatePasswordResetLink(email);

    // 	console.log(foo);
    // };

    return {
        getUser,
        getUsers,
        deleteUser
    };
}
