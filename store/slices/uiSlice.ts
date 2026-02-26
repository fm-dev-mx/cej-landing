import { StateCreator } from 'zustand';

export interface UISlice {
    isDrawerOpen: boolean;
    activeTab: 'order' | 'history';
    isProcessingOrder: boolean;
    editingItemId: string | null;
    setDrawerOpen: (isOpen: boolean) => void;
    setActiveTab: (tab: 'order' | 'history') => void;
    setProcessingOrder: (isProcessing: boolean) => void;
    setEditingItemId: (id: string | null) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
    isDrawerOpen: false,
    activeTab: 'order',
    isProcessingOrder: false,
    editingItemId: null,
    setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setProcessingOrder: (isProcessing) => set({ isProcessingOrder: isProcessing }),
    setEditingItemId: (id) => set({ editingItemId: id }),
});
