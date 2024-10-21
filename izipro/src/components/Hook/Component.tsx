import { format, formatDistanceToNow, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// date format for message
export const formatMessageDate = (dateString: string) => {
    const date = parseISO(new Date(Number(dateString)).toISOString());
    if (isToday(date)) {
        return format(date, 'HH:mm', { locale: fr });
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
};