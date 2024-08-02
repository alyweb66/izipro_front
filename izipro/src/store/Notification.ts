import { create } from 'zustand';
import { NotificationProps} from '../Type/Notification';

type NotificationStore = NotificationProps & {
    setEmailNotification: (data: NotificationProps['email_notification']) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    email_notification: null,
    setEmailNotification: (data) => set({ email_notification: data }),
}));