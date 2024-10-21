import { create } from 'zustand';
import { NotificationProps} from '../Type/Notification';

type NotificationStore = NotificationProps & {
    setEmailNotification: (data: NotificationProps['email_notification']) => void;
    setEndpoint: (data: NotificationProps['endpoint']) => void;
    resetNotification: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    email_notification: null,
    endpoint: null,
    setEmailNotification: (data) => set({ email_notification: data }),
    setEndpoint: (data) => set({ endpoint: data }),
    resetNotification: () => set({ email_notification: null, endpoint: null }),
}));