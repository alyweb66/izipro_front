import { useMutation } from "@apollo/client";
import { CREATE_NOTIFICATION_PUSH_MUTATION, DELETE_NOTIFICATION_PUSH_MUTATION } from "../GraphQL/notificationMutation";
import { useQueryVAPIDKey } from "./Query";
import { userDataStore } from "../../store/UserData";
import { userNotificationStore } from "../../store/Notification";
import { useShallow } from 'zustand/shallow';

type SubscriptionData = {
    endpoint: string;
    keys: {
        auth: string;
        p256dh: string;
    };
}

const serviceWorkerRegistration = () => {
    // Store
    const id = userDataStore(useShallow((state) => state.id));
    const setEnpointStore = userNotificationStore(useShallow((state) => state.setEndpoint));
    // Mutation
    const [createNotification, { error: notificationError }] = useMutation(CREATE_NOTIFICATION_PUSH_MUTATION);
    const [deleteNotification, { error: deleteNotificationError }] = useMutation(DELETE_NOTIFICATION_PUSH_MUTATION);
    
    const { fetchVAPIDKey } = useQueryVAPIDKey();

    // Ask for permission to send notifications
    async function askPermission() {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            registerServiceWorker();
        }
    }

    // Register service worker
    async function registerServiceWorker() {

        // check if service worker is supported
        const registration = await navigator.serviceWorker.register('/serviceWorker.js');
        // get subscription if already exists
        let subscription = await registration.pushManager.getSubscription();


        if (!subscription) {
            // subscribe to push notification
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: await getPublicKey()
            });

            saveSubscription(subscription);
        } else {

            saveSubscription(subscription);
        }

    }

    // Save subscription to database
    async function saveSubscription(subscription: PushSubscription) {
        
        const subscriptionData: SubscriptionData = JSON.parse(JSON.stringify(subscription));
        
        if (id > 0) {
            createNotification({
                variables: {
                    input: {
                        user_id: id,
                        endpoint: subscriptionData.endpoint,
                        auth_token: subscriptionData.keys.auth,
                        public_key: subscriptionData.keys.p256dh
                    }
                }
            }).then(() => {
                
                setEnpointStore(subscriptionData.endpoint);
            });

            if (notificationError) {
                throw new Error('Error while saving subscription');
            }
        }
    }

    // Get public key
    async function getPublicKey() {
        const result = await fetchVAPIDKey();
        const publicKey = result?.data?.user?.publicKey;

        if (publicKey) {
            return publicKey;
        }

    }

    // Unsubscribe from notifications
    async function disableNotifications() {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                deleteSubscription(subscription);
            }
        }
    }

    // Delete subscription from server
    async function deleteSubscription(subscription: PushSubscription) {
        const subscriptionData: SubscriptionData = JSON.parse(JSON.stringify(subscription));

        if (id > 0) {
            deleteNotification({
                variables: {
                    input: {
                        user_id: id,
                        endpoint: subscriptionData.endpoint,
                    }
                }
            });

            if (deleteNotificationError) {
                throw new Error('Error while deleting subscription');
            }
        }
    }


    return { askPermission, registerServiceWorker, disableNotifications };
};

export default serviceWorkerRegistration;

