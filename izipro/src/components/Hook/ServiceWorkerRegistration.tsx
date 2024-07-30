import { useMutation } from "@apollo/client";
import { CREATE_NOTIFICATION_MUTATION, DELETE_NOTIFICATION_MUTATION } from "../GraphQL/notificationMutation";
import { useQueryVAPIDKey } from "./Query";
import { userDataStore } from "../../store/UserData";


type SubscriptionData = {
    endpoint: string;
    keys: {
        auth: string;
        p256dh: string;
    };
}

const serviceWorkerRegistration = () => {
    const { fetchVAPIDKey } = useQueryVAPIDKey();
    // Store
    const id = userDataStore((state) => state.id);
    // Mutation
    const [createNotification, { error: notificationError }] = useMutation(CREATE_NOTIFICATION_MUTATION);
    const [deleteNotification, { error: deleteNotificationError }] = useMutation(DELETE_NOTIFICATION_MUTATION);


    // Ask for permission to send notifications
    async function askPermission() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            registerServiceWorker();
        }
    }

    // Register service worker
    async function registerServiceWorker() {
        
        const registration = await navigator.serviceWorker.register('/serviceWorker.js');
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: await getPublicKey()
            });

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
        console.log('subscriptionData', subscriptionData);

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

