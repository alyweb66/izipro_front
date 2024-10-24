import { messageDataStore, MessageStore } from "../../store/message";
import { RequestConversationStore, requestConversationStore, requestDataStore } from "../../store/Request";
import { subscriptionDataStore } from "../../store/subscription";
import { userDataStore } from "../../store/UserData";
import { MessageProps } from "../../Type/message";
import { RequestProps } from "../../Type/Request";

type manageMessageProps = {
    newMessage: MessageProps;
    requestId?: number;
    isNewConversation: boolean;
    setConversationIdState?: (id: number) => void;
}
// hook to manage the message
export const UpdateMyConvMessage = () => {

    const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
    const id = userDataStore((state) => state.id);
    const request = requestDataStore((state) => state.request);

    const manageMessage = ({ newMessage, setConversationIdState, isNewConversation, requestId }: manageMessageProps) => {
        const date = new Date(Number(newMessage.created_at));
        const newDate = date.toISOString();
        const newConversation = {
            id: newMessage.conversation_id,
            user_1: id,
            user_2: request.user_id,
            request_id: requestId ?? 0,
            updated_at: newDate
        };


        // add the new message to the message store
        messageDataStore.setState((prevState: MessageStore): Partial<MessageStore> => {
            const existingMessages = !prevState.messages?.find((existingMessage) => existingMessage.id === newMessage.id);

            if (existingMessages) {
                return {
                    ...prevState,
                    messages: [...prevState.messages, newMessage]
                };
            } else {
                return prevState;
            }

        });

        if (isNewConversation) {
            // Chek if the conversation is already in the request
            const existingConversation = request.conversation?.some(conversation => conversation.id === newMessage.conversation_id);

            // insert the new conversation in the request
            let newRequest: RequestProps = { ...request, conversation: request.conversation || [] };
            if (!existingConversation) {
                newRequest = { ...request, conversation: [...(request.conversation || []), newConversation] };
            }

            // insert the new request in the request store
            requestConversationStore.setState((prevState: RequestConversationStore): Partial<RequestConversationStore> => {
                const requests = prevState.requests || [];  // Sur to be an array
                const existingRequest = requests.some(request => request.id === requestId);

                if (!existingRequest) {
                    const updatedRequests = [...requests, newRequest];  // Keep the previous requests and add the new one
                    return { requests: updatedRequests };
                }

                return prevState;  // Return the previous state if the request already exists
            });
            // set the conversation id state to see the new message
            setConversationIdState && setConversationIdState(newMessage.conversation_id);

            // update subscription store
            if (subscriptionStore.some(subscription => subscription.subscriber === 'clientConversation')) {
                const newSubscription = subscriptionStore.map(subscription => {
                    if (subscription.subscriber === 'clientConversation' && Array.isArray(subscription.subscriber_id) && !subscription.subscriber_id.includes(newMessage.conversation_id)) {

                        // create new subscriber_id array
                        const newSubscriberId = [...subscription.subscriber_id, newMessage.conversation_id];
                        // Return new subscription
                        return { ...subscription, subscriber_id: newSubscriberId };
                    }
                    return subscription;
                });
                // update the subscription store
                setSubscriptionStore(newSubscription);
            } else {
                // Create new subscription
                setSubscriptionStore([...subscriptionStore, { subscriber: 'clientConversation', subscriber_id: [newMessage.conversation_id], user_id: id, created_at: new Date().toISOString() }]);
            }
        } else {

            // add updated_at to the request.conversation
            requestConversationStore.setState((prevState: RequestConversationStore): Partial<RequestConversationStore> => {
                const updatedRequest = prevState.requests.map((request: RequestProps) => {
                    if (request.id === newConversation.request_id) {
                        const conversationExists = request.conversation?.some(conversation => conversation.id === newConversation.id);

                        const updatedConversation = conversationExists
                            ? request.conversation.map(conversation => {
                                if (conversation.id === newConversation.id) {
                                    return { ...conversation, updated_at: newDate };
                                }
                                return conversation;
                            })
                            : [...(request.conversation || []), newConversation];

                        return { ...request, conversation: updatedConversation };
                    }
                    return request;
                });

                return { requests: updatedRequest };
            });

        }
    }

    return { manageMessage };
}

