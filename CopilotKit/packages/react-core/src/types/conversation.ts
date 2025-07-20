import { Message } from "@copilotkit/runtime-client-gql";

/**
 * Configuration for conversation management
 */
export interface ConversationConfig {
    /**
     * Base URL for the conversation API
     */
    apiBaseUrl: string;

    /**
     * User identifier for conversation ownership
     */
    userId: string;

    /**
     * Optional HTTP headers for API requests
     */
    headers?: Record<string, string>;

    /**
     * Whether to automatically save messages
     * @default true
     */
    autoSave?: boolean;

    /**
     * Custom endpoints configuration
     */
    endpoints?: {
        conversations?: string;
        messages?: string;
        create?: string;
        delete?: string;
    };
}

/**
 * Conversation metadata
 */
export interface Conversation {
    /**
     * Unique conversation identifier
     */
    id: string;

    /**
     * User who owns this conversation
     */
    userId: string;

    /**
     * Display title for the conversation
     */
    title: string;

    /**
     * When the conversation was created
     */
    createdAt: string;

    /**
     * When the conversation was last updated
     */
    updatedAt: string;

    /**
     * Preview of the last message
     */
    lastMessage?: string;

    /**
     * Number of messages in the conversation
     */
    messageCount?: number;

    /**
     * Additional metadata
     */
    metadata?: Record<string, any>;
}

/**
 * Conversation message for API persistence
 */
export interface ConversationMessage {
    /**
     * Unique message identifier
     */
    id: string;

    /**
     * Conversation this message belongs to
     */
    conversationId: string;

    /**
     * User who sent/received this message
     */
    userId: string;

    /**
     * Message role (user, assistant, system)
     */
    role: 'user' | 'assistant' | 'system';

    /**
     * Message content
     */
    content: string;

    /**
     * When the message was created
     */
    createdAt: string;

    /**
     * When the message was last updated
     */
    updatedAt: string;

    /**
     * Message metadata for different message types
     */
    messageMetadata?: {
        type: string;
        messageId: string;
        [key: string]: any;
    };
}

/**
 * Conversation loading state
 */
export interface ConversationState {
    /**
     * List of available conversations
     */
    conversations: Conversation[];

    /**
     * Currently active conversation ID
     */
    currentConversationId?: string;

    /**
     * Whether conversations are being loaded
     */
    isLoading: boolean;

    /**
     * Any error that occurred
     */
    error?: string;

    /**
     * Whether conversations have been loaded at least once
     */
    initialized: boolean;
}

/**
 * Conversation management methods
 */
export interface ConversationMethods {
    /**
     * Load all conversations for the current user
     */
    loadConversations: () => Promise<void>;

    /**
 * Load messages for a specific conversation
 */
    loadConversation: (conversationId: string) => Promise<Message[] | undefined>;

    /**
     * Create a new conversation
     */
    createConversation: (title?: string) => Promise<string>;

    /**
     * Delete a conversation
     */
    deleteConversation: (conversationId: string) => Promise<void>;

    /**
     * Set the current active conversation
     */
    setCurrentConversation: (conversationId?: string) => void;

    /**
     * Save a message to the current conversation
     */
    saveMessage: (message: Message) => Promise<void>;

    /**
     * Clear any conversation errors
     */
    clearError: () => void;

    /**
     * Refresh the conversation list
     */
    refreshConversations: () => Promise<void>;
}

/**
 * Props for conversation change callback
 */
export interface ConversationChangeProps {
    /**
     * The new conversation ID (undefined for no conversation)
     */
    conversationId?: string;

    /**
     * The conversation object if available
     */
    conversation?: Conversation;

    /**
     * Previous conversation ID
     */
    previousConversationId?: string;
}

/**
 * Callback for conversation changes
 */
export type ConversationChangeCallback = (props: ConversationChangeProps) => void; 