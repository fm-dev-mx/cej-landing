import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface UserState {
    visitorId: string;
    name?: string;
    phone?: string;
    hasConsentedPersistence: boolean;
}

export interface UserSlice {
    user: UserState;
    updateUserContact: (contact: { name: string; phone: string; save: boolean }) => void;
}

export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (set) => ({
    user: {
        visitorId: uuidv4(),
        hasConsentedPersistence: true,
    },
    updateUserContact: ({ name, phone, save }) => set((state) => ({
        user: {
            ...state.user,
            name: save ? name : state.user.name,
            phone: save ? phone : state.user.phone,
            hasConsentedPersistence: save
        }
    })),
});
