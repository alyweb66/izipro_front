import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MessageProps } from "../../Type/message";


type ScrollListProps = {
    filteredMessages?: MessageProps[] | undefined;
    conversationIdState?: number;
    isListOpen?: boolean;
};


export const ScrollList = ({ filteredMessages, conversationIdState, isListOpen }: ScrollListProps) => {

    const [isEndVisible, setIsEndVisible] = useState(false);
    const [isEndViewed, setIsEndViewed] = useState(false);
    const [isElementPresent, setIsElementPresent] = useState(false);

    const endMessageListRef = useRef<HTMLDivElement | null>(null);
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
    const lastMessageIdRef = useRef(0);

    // Get the last message id to scroll to the last message
    const lastMessageId = useMemo(() => {
        if (filteredMessages && filteredMessages.length > 0) {
            if (lastMessageIdRef.current === 0) {
                lastMessageIdRef.current = filteredMessages[filteredMessages.length - 1].id;
            }
            return filteredMessages[filteredMessages.length - 1].id;
        }
        return null;
    }, [filteredMessages]);

    // Scroll to end of the list
    const scrollToEnd = () => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {

                    // L'élément est visible, on arrête l'observation.
                    observer.disconnect();
                } else {
                    // Si l'élément n'est pas visible, on réexécute le scroll.
                    setTimeout(() => {

                        endMessageListRef.current?.scrollIntoView({ behavior: 'auto' });
                    }, 0);
                }
            },
            { threshold: 1.0 } // On vérifie que 100% de l'élément est visible
        );

        if (endMessageListRef.current) {
            // On commence à observer l'élément
            observer.observe(endMessageListRef.current);

            // Premier scroll vers la fin
            endMessageListRef.current.scrollIntoView({ behavior: 'auto' });
        }
    };

    // Reset isEndViewed when conversationIdState changes
    useLayoutEffect(() => {
        if (conversationIdState && conversationIdState > 0 && isEndViewed) {

            setIsEndViewed(false);
        }
    }, [conversationIdState]);

    // last message observer to know when last message is present
    useEffect(() => {
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const lastMessageElement = document.querySelector(`[data-key="${lastMessageId}"]`);
                    if (lastMessageElement) {
                        setIsElementPresent(true);
                        observer.disconnect();
                        break;
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
        };
    }, [lastMessageId]);

    // Image observer for lazy loading
    useLayoutEffect(() => {

        // Create an observer 
        const observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        const fullImageSrc = img.getAttribute('data-src');
                        if (fullImageSrc) {
                            // img.src = fullImageSrc; // Replace the src with the data-src
                            const preloadedImg = new Image();
                            preloadedImg.src = fullImageSrc;
                            preloadedImg.onload = () => {
                                img.classList.add('loading'); // Add loading class

                                setTimeout(() => {
                                    img.src = fullImageSrc;  // Replace the src with the data-src
                                    img.classList.remove('loading');
                                    img.classList.add('loaded');

                                }, 100);
                            };
                        }
                        observer.unobserve(img); // stop observing the image
                    }
                });
            },
            { rootMargin: '1500px', threshold: 0.1 }
        );

        // image observer
        imageRefs.current?.forEach((img) => {
            if (img) {
                observer.observe(img);
            }
        });

        // instance cleanup 
        return () => {
            observer.disconnect();
        };
    }, [filteredMessages, isEndVisible]);

    // Scroll to last message
    useLayoutEffect(() => {
        
        if (!lastMessageId || filteredMessages?.length === 0) {
            setIsEndViewed(true);
            return;
        }

        const scrollToLastMessage = (delay = 350) => {
            setTimeout(() => {
                const lastMessageElement = document.querySelector(`[data-key="${lastMessageId}"]`);
                if (lastMessageElement) {
                    lastMessageElement.scrollIntoView({ behavior: 'instant' });

                    // Verify if the last message is visible
                    const lastMessageRect = lastMessageElement.getBoundingClientRect();
                    const isLastMessageInView = (
                        lastMessageRect.top >= 0 &&
                        lastMessageRect.left >= 0 &&
                        lastMessageRect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        lastMessageRect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    );

                    // if not visible, try again
                    if (!isLastMessageInView) {
                        scrollToLastMessage(100); // Try again after 100ms
                    } else {
                        setIsEndViewed(true);
                    }
                }
            }, delay);
        };

        // Scroll to last message if conversationIdState is present and end is not viewed
        if (conversationIdState && conversationIdState > 0 && !isEndViewed) {

            scrollToLastMessage();
        }

        // Scroll to last message if new message is added and end is in view
        if (lastMessageId !== null && lastMessageIdRef.current < lastMessageId) {
            scrollToLastMessage();
            lastMessageIdRef.current = lastMessageId;
        }
    }, [conversationIdState, isEndViewed, isElementPresent, filteredMessages, lastMessageId, isListOpen]);


    // Reset isElementPresent when isEndViewed is true
    useEffect(() => {
        if (isEndViewed) {
            setTimeout(() => {
                setIsElementPresent(false);
            }, 500);
        }
    }, [isEndViewed]);

    // last message observer
    useLayoutEffect(() => {
        const endObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // if last message is intersecting and not viewed
                    if (!isEndViewed && entry.isIntersecting) {
                        setTimeout(() => {
                            const lastMessageElement = document.querySelector(`[data-key="${lastMessageId}"]`);
                            const isStillIntersecting = lastMessageElement && lastMessageElement.getBoundingClientRect().top < window.innerHeight && lastMessageElement.getBoundingClientRect().bottom >= 0;

                            if (isStillIntersecting) {

                                setIsEndViewed(true);
                            } else {
                                scrollToEnd();
                            }
                        }, 150);
                    }

                    setIsEndVisible(entry.isIntersecting);
                });
            },
            { threshold: 1 }
        );

        // specific id of last message
        const lastMessageElement = document.querySelector(`[data-key="${lastMessageId}"]`);

        if (lastMessageElement) {
            endObserver.observe(lastMessageElement);
        }

        return () => {
            if (lastMessageElement) {
                endObserver.unobserve(lastMessageElement);
            }
        };
    }, [lastMessageId, isElementPresent, isListOpen]);


    return { endMessageListRef, imageRefs, isEndViewed, setIsEndViewed };
};