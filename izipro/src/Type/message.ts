type MessageProps = {
	id: number;
	content: string;
	conversation_id: number;
    message: {
        id: number
        content: string
        user_id: number
        conversation_id: number
        created_at: string
        media: [{
            id: number
            url: string
            name: string
        }]
    }
};

type MessageStoreProps = {
        id: number
        content: string
        user_id: number
        conversation_id: number
        created_at: string
        media: [{
            id: number
            url: string
            name: string
        }]
};



export type { MessageProps, MessageStoreProps};