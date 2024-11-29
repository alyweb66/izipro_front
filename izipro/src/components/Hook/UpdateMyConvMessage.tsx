import { messageDataStore, MessageStore } from "../../store/message";
import { RequestConversationStore, requestConversationStore, requestDataStore } from "../../store/Request";
import { subscriptionDataStore } from "../../store/subscription";
import { userDataStore } from "../../store/UserData";
import { MessageProps } from "../../Type/message";
import { RequestProps } from "../../Type/Request";
import { useShallow } from 'zustand/shallow';

type manageMessageProps = {
    newMessage: MessageProps;
    requestId?: number;
    isNewConversation: boolean;
    setConversationIdState?: (id: number) => void;
}
// hook to manage the message
export const UpdateMyConvMessage = () => {

    const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore(useShallow((state) => [state.subscription, state.setSubscription]));
    const id = userDataStore(useShallow((state) => state.id));
    const request = requestDataStore(useShallow((state) => state.request));

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
   
            // insert new conversation in the request store
            requestConversationStore.setState((prevState: RequestConversationStore): Partial<RequestConversationStore> => {
                const updatedRequest = prevState.requests.map((request: RequestProps) => {
                    if (request.id === requestId) {
                        // check if the conversation already exists
                        const conversationExists = request.conversation?.some(conversation => conversation.id === newMessage.conversation_id);
                        if (conversationExists) {
                            return request;
                        }
                        return { ...request, conversation: [newConversation] };
                    }
                    return request;
                });

                return { requests: updatedRequest };
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
                    
                    if (request.id === newMessage.request_id) {
                        const conversationExists = request.conversation?.some(conversation => conversation.id === newMessage.conversation_id);

                        const updatedConversation = conversationExists
                            ? request.conversation.map(conversation => {
                                if (conversation.id === newMessage.conversation_id) {
                                    return { ...conversation, updated_at: newDate };
                                }
                                return conversation;
                            })
                            : [...(request.conversation || [])];

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

