import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';
import API_ENDPOINTS, { getApiBaseUrl } from '../src/config/apiConfig';

const REACTION_OPTIONS = ['👍', '❤️', '👏', '❓'];
const toId = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (value._id) return String(value._id);
        if (value.$oid) return String(value.$oid);
    }
    return String(value);
};

const DiscussionForum = ({ eventId, role, token }) => {
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [messageType, setMessageType] = useState('message');
    const [replyToId, setReplyToId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState(null);
    const [newMessagesCount, setNewMessagesCount] = useState(0);

    const isOrganizer = role === 'organizer';
    const initializedRef = useRef(false);
    const knownMessageIdsRef = useRef(new Set());
    const ignoredNewMessageIdsRef = useRef(new Set());
    const socketRef = useRef(null);
    const composeRef = useRef(null);
    const textareaRef = useRef(null);

    const listEndpoint = isOrganizer
        ? `/api/organizerEvents/${eventId}/forum/messages`
        : `/api/participant/events/${eventId}/forum/messages`;

    const reactionEndpoint = isOrganizer
        ? '/api/organizerEvents/forum/messages'
        : '/api/participant/forum/messages';

    const socketUrl = import.meta.env.VITE_SOCKET_URL || getApiBaseUrl() || window.location.origin;

    const fetchMessages = useCallback(async (showLoader = false) => {
        if (!eventId || !token) return;

        if (showLoader) {
            setLoading(true);
        }

        try {
            const response = await fetch(listEndpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load forum messages');
            }

            if (initializedRef.current) {
                const newIds = data
                    .map((message) => toId(message._id))
                    .filter((id) => !knownMessageIdsRef.current.has(id))
                    .filter((id) => !ignoredNewMessageIdsRef.current.has(id));
                if (newIds.length > 0) {
                    setNewMessagesCount((prev) => prev + newIds.length);
                }

                ignoredNewMessageIdsRef.current.forEach((id) => {
                    if (knownMessageIdsRef.current.has(id)) {
                        ignoredNewMessageIdsRef.current.delete(id);
                    }
                });
            }

            knownMessageIdsRef.current = new Set(data.map((message) => toId(message._id)));
            initializedRef.current = true;
            setMessages(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load forum messages');
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    }, [eventId, token, listEndpoint]);

    useEffect(() => {
        fetchMessages(true);

        const socket = io(socketUrl, {
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('forum:join', eventId);
        });

        socket.on('forum:updated', (payload) => {
            if (String(payload?.eventId) === String(eventId)) {
                fetchMessages(false);
            }
        });

        return () => {
            socket.emit('forum:leave', eventId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [fetchMessages, eventId, socketUrl]);

    const replyMap = useMemo(() => {
        const map = new Map();
        messages.forEach((message) => {
            if (!message.parentMessageId) return;
            const parentId = toId(message.parentMessageId);
            if (!map.has(parentId)) {
                map.set(parentId, []);
            }
            map.get(parentId).push(message);
        });
        return map;
    }, [messages]);

    const topLevelMessages = useMemo(
        () => messages.filter((message) => !message.parentMessageId),
        [messages]
    );

    const submitMessage = async () => {
        if (!content.trim()) return;

        setPosting(true);
        try {
            const response = await fetch(listEndpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content.trim(),
                    messageType,
                    parentMessageId: toId(replyToId)
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to post message');
            }

            if (data?._id) {
                const postedId = toId(data._id);
                ignoredNewMessageIdsRef.current.add(postedId);
                knownMessageIdsRef.current.add(postedId);
            }

            setContent('');
            setReplyToId(null);
            await fetchMessages(false);
        } catch (err) {
            setError(err.message || 'Failed to post message');
        } finally {
            setPosting(false);
        }
    };

    const handleReplyClick = (messageId) => {
        setReplyToId(toId(messageId));
        if (composeRef.current) {
            composeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        try {
            const response = await fetch(`${reactionEndpoint}/${messageId}/reactions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emoji })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update reaction');
            }

            setMessages((prev) => prev.map((message) => (
                toId(message._id) === toId(messageId) ? data : message
            )));
        } catch (err) {
            setError(err.message || 'Failed to update reaction');
        }
    };

    const togglePin = async (messageId) => {
        try {
            const response = await fetch(`/api/organizerEvents/${eventId}/forum/messages/${messageId}/pin`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update pin status');
            }

            setMessages((prev) => prev
                .map((message) => (toId(message._id) === toId(messageId) ? data : message))
                .sort((a, b) => {
                    if (a.isPinned !== b.isPinned) {
                        return a.isPinned ? -1 : 1;
                    }
                    return new Date(a.createdAt) - new Date(b.createdAt);
                }));
        } catch (err) {
            setError(err.message || 'Failed to update pin status');
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            const response = await fetch(`/api/organizerEvents/${eventId}/forum/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete message');
            }

            setMessages((prev) => prev.filter((message) => (
                toId(message._id) !== toId(messageId)
                && toId(message.parentMessageId) !== toId(messageId)
            )));
        } catch (err) {
            setError(err.message || 'Failed to delete message');
        }
    };

    const renderMessage = (message, isReply = false) => {
        const typeClass = `forum-tag ${message.messageType}`;
        const replies = replyMap.get(toId(message._id)) || [];

        return (
            <div key={message._id} className={`forum-message ${isReply ? 'reply' : ''}`}>
                <div className="forum-message-head">
                    <div>
                        <strong>{message.authorName}</strong>
                        <span className="forum-meta"> · {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                    </div>
                    <div className="forum-flags">
                        {message.isPinned && <span className="forum-pin">Pinned</span>}
                        <span className={typeClass}>{message.messageType}</span>
                    </div>
                </div>

                <p>{message.content}</p>

                <div className="forum-actions-row">
                    <button type="button" onClick={() => handleReplyClick(message._id)} className="forum-action-btn">Reply</button>

                    {REACTION_OPTIONS.map((emoji) => (
                        <button
                            type="button"
                            key={`${message._id}-${emoji}`}
                            onClick={() => toggleReaction(message._id, emoji)}
                            className={`forum-reaction-btn ${message.reactedByCurrentUser ? 'active' : ''}`}
                        >
                            {emoji} {message.reactionSummary?.[emoji] || 0}
                        </button>
                    ))}

                    {isOrganizer && (
                        <>
                            <button type="button" onClick={() => togglePin(message._id)} className="forum-action-btn">
                                {message.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button type="button" onClick={() => deleteMessage(message._id)} className="forum-action-btn danger">
                                Delete
                            </button>
                        </>
                    )}
                </div>

                {replies.length > 0 && (
                    <div className="forum-replies">
                        {replies.map((reply) => renderMessage(reply, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <section className="event-details-section discussion-forum-section">
            <h3>Discussion Forum</h3>

            {newMessagesCount > 0 && (
                <div className="forum-notification">
                    {newMessagesCount} new message{newMessagesCount > 1 ? 's' : ''}
                    <button type="button" onClick={() => setNewMessagesCount(0)}>Clear</button>
                </div>
            )}

            <div className="forum-compose" ref={composeRef}>
                <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                >
                    <option value="message">Message</option>
                    <option value="question">Question</option>
                    {isOrganizer && <option value="announcement">Announcement</option>}
                </select>

                {replyToId && (
                    <div className="forum-reply-indicator">
                        Replying in thread
                        <button type="button" onClick={() => setReplyToId(null)}>Cancel</button>
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    placeholder="Write a message..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <button type="button" onClick={submitMessage} disabled={posting || !content.trim()}>
                    {posting ? 'Posting...' : 'Post'}
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {loading ? (
                <p>Loading forum messages...</p>
            ) : topLevelMessages.length === 0 ? (
                <p>No messages yet.</p>
            ) : (
                <div className="forum-list">
                    {topLevelMessages.map((message) => renderMessage(message))}
                </div>
            )}
        </section>
    );
};

export default DiscussionForum;
