import { StateCreator } from 'zustand';
import { type Order, type OrderStatus, type PaymentStatus } from '@/types/domain';

export interface OrderSlice {
    orders: Order[];
    addOrder: (order: Order) => void;
    updateOrderStatus: (id: string, status: OrderStatus) => void;
    updatePaymentStatus: (id: string, status: PaymentStatus) => void;
    deleteOrder: (id: string) => void;
}

export const createOrderSlice: StateCreator<OrderSlice, [], [], OrderSlice> = (set) => ({
    orders: [],
    addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
    })),
    updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status, updatedAt: Date.now() } : o)
    })),
    updatePaymentStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, paymentStatus: status, updatedAt: Date.now() } : o)
    })),
    deleteOrder: (id) => set((state) => ({
        orders: state.orders.filter(o => o.id !== id)
    })),
});
