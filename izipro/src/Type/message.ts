type MessageProps = {
        id: number
        content: string
        user_id: number
        conversation_id: number
        created_at: string
        request_id: number
        viewed: boolean
        media: {
            id: number
            url: string
            name: string
        }[]
    
};

type MessageStoreProps = {
        id: number
        content: string
        user_id: number
        conversation_id: number
        created_at: string
        viewed: boolean
        media: {
            id: number
            url: string
            name: string
        }[]
};



export type { MessageProps, MessageStoreProps};