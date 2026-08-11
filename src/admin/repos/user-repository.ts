import { auth, db } from '@src/admin/config.js';
import {
    createUserInstance,
    type AccountStatus,
    type User,
    type UserInstance
} from '@domain/user.js';
import { FieldValue } from 'firebase-admin/firestore';

export type UserRepository = {
    save(id: string, user: User): Promise<void>;
    updateEmail(id: string, user: User): Promise<void>;
    updateAccountStatus(id: string, newStatus: AccountStatus): Promise<void>;
    updatePassword(id: string, user: User): Promise<void>;
    removeUser(id: string): Promise<void>;
    findById: (id: string) => Promise<UserInstance>;
};

export function createUserRepository(): UserRepository {
    const save = async (id: string, user: User): Promise<void> => {
        await auth.updateUser(id, {
            ...user
        });
    };

    const removeUser = async (id: string) => {
        await auth.deleteUser(id);
    };

    const updateEmail = async (id: string, user: User): Promise<void> => {
        await auth.updateUser(id, {
            email: user.email
        });
    };

    const updateAccountStatus = async (
        id: string,
        newStatus: AccountStatus
    ): Promise<void> => {
        let disable = false;
        if (newStatus === 'DISABLED') {
            disable = true;
        }

        if (newStatus === 'ACTIVE') {
            disable = false;
        }

        if (newStatus === 'ACTIVE' || newStatus === 'DISABLED') {
            await auth.updateUser(id, {
                disabled: disable
            });
        }

        const userRef = db.collection('users').doc(id);

        const userDoc = (await userRef.get()).data() as User;
        const userPreviousStatus = userDoc.status;

        if (
            newStatus === 'REMOVE_PENDING_DELETION' &&
            userPreviousStatus === 'PENDING_DELETION'
        ) {
            userRef.set({
                deletionRequestedAt: FieldValue.delete(),
                deletionScheduledFor: FieldValue.delete(),
                status: FieldValue.delete(),
                revokedAt: FieldValue.delete(),
                tokensValidAfterTime: FieldValue.delete()
            },
                {
                    merge: true
                });
        }
        if (newStatus === 'PENDING_DELETION') {
            await userRef.set(
                {
                    status: newStatus
                },
                { merge: true }
            );
        }
    };

    const updatePassword = async (id: string, user: User): Promise<void> => {
        await auth.updateUser(id, {
            password: user.password
        });
    };

    const findById = async (id: string): Promise<UserInstance> => {
        const userRecord = await auth.getUser(id);

        const userSnap = await db.collection('users').doc(id).get();
        const userData = userSnap.data() as User;

        const user: User = {
            id: userRecord.uid,
            email: userRecord.email ?? '',
            password: userRecord.passwordHash ?? '',
            status: userData?.status,
            customClaims: { ...userRecord.customClaims }
        };

        return createUserInstance(user);
    };

    return {
        save,
        findById,
        updateAccountStatus,
        updateEmail,
        removeUser,
        updatePassword
    };
}
