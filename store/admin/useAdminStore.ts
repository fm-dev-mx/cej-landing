import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createOrderSlice, type OrderSlice } from "@/store/slices/ordersSlice";

export type AdminStore = OrderSlice;

type PersistedState = Pick<AdminStore, "orders">;

export const useAdminStore = create<AdminStore>()(
    persist(
        (set, get, api) => ({
            ...createOrderSlice(set, get, api),
        }),
        {
            name: "cej-admin-storage",
            storage: createJSONStorage(() => localStorage),
            version: 1,
            partialize: (state): PersistedState => ({
                orders: state.orders,
            }),
        },
    ),
);
