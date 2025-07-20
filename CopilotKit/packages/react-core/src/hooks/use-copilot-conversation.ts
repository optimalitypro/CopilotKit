import { useCallback, useEffect } from "react";
import { useCopilotContext } from "../context/copilot-context";
import { Conversation, ConversationState } from "../types/conversation";

/**
 * Hook for accessing conversation state and methods
 */
export function useCopilotConversation() {
    const context = useCopilotContext();

    const {
        conversationConfig,
        conversationState,
        conversationMethods,
        onConversationChange,
    } = context;

    return {
        // Configuration
        conversationConfig,
        onConversationChange,
        isEnabled: !!conversationConfig,

        // State
        conversations: conversationState.conversations,
        currentConversationId: conversationState.currentConversationId,
        isLoading: conversationState.isLoading,
        error: conversationState.error,
        initialized: conversationState.initialized,

        // Methods
        loadConversations: conversationMethods.loadConversations,
        loadConversation: conversationMethods.loadConversation,
        createConversation: conversationMethods.createConversation,
        deleteConversation: conversationMethods.deleteConversation,
        setCurrentConversation: conversationMethods.setCurrentConversation,
        saveMessage: conversationMethods.saveMessage,
        clearError: conversationMethods.clearError,
        refreshConversations: conversationMethods.refreshConversations,
    };
}

/**
 * Hook for conversation history management
 */
export function useCopilotConversationHistory() {
    const {
        conversations,
        isLoading,
        error,
        initialized,
        loadConversations,
        refreshConversations,
        isEnabled,
    } = useCopilotConversation();

    // Auto-load conversations on mount if enabled
    useEffect(() => {
        if (isEnabled && !initialized && !isLoading) {
            loadConversations();
        }
    }, [isEnabled, initialized, isLoading, loadConversations]);

    const refresh = useCallback(async () => {
        if (!isEnabled) return;
        await refreshConversations();
    }, [isEnabled, refreshConversations]);

    return {
        conversations,
        isLoading,
        error,
        initialized,
        isEnabled,
        refresh,
        loadConversations,
    };
}

/**
 * Hook for managing the current conversation
 */
export function useCopilotCurrentConversation() {
    const {
        currentConversationId,
        conversations,
        setCurrentConversation,
        loadConversation,
        isEnabled,
    } = useCopilotConversation();

    const currentConversation = conversations.find(c => c.id === currentConversationId);

    const switchToConversation = useCallback(async (conversationId: string) => {
        if (!isEnabled) return;

        setCurrentConversation(conversationId);
        await loadConversation(conversationId);
    }, [isEnabled, setCurrentConversation, loadConversation]);

    const clearCurrentConversation = useCallback(() => {
        if (!isEnabled) return;
        setCurrentConversation(undefined);
    }, [isEnabled, setCurrentConversation]);

    return {
        currentConversationId,
        currentConversation,
        isEnabled,
        switchToConversation,
        clearCurrentConversation,
        setCurrentConversation,
    };
}

/**
 * Hook for conversation creation and management
 */
export function useCopilotConversationActions() {
    const {
        createConversation,
        deleteConversation,
        refreshConversations,
        isLoading,
        isEnabled,
    } = useCopilotConversation();

    const createNewConversation = useCallback(async (title?: string) => {
        if (!isEnabled) return '';

        const conversationId = await createConversation(title);
        await refreshConversations();
        return conversationId;
    }, [isEnabled, createConversation, refreshConversations]);

    const removeConversation = useCallback(async (conversationId: string) => {
        if (!isEnabled) return;

        await deleteConversation(conversationId);
        // No need to refresh as deleteConversation already updates local state
    }, [isEnabled, deleteConversation]);

    return {
        createNewConversation,
        removeConversation,
        isLoading,
        isEnabled,
    };
}

/**
 * Hook for conversation search and filtering
 */
export function useCopilotConversationSearch() {
    const { conversations, isEnabled } = useCopilotConversation();

    const searchConversations = useCallback((query: string): Conversation[] => {
        if (!isEnabled || !query.trim()) return conversations;

        const lowerQuery = query.toLowerCase();
        return conversations.filter(conversation =>
            conversation.title.toLowerCase().includes(lowerQuery) ||
            conversation.lastMessage?.toLowerCase().includes(lowerQuery)
        );
    }, [conversations, isEnabled]);

    const filterConversations = useCallback((predicate: (conversation: Conversation) => boolean): Conversation[] => {
        if (!isEnabled) return [];
        return conversations.filter(predicate);
    }, [conversations, isEnabled]);

    const sortConversations = useCallback((
        conversations: Conversation[],
        sortBy: 'title' | 'createdAt' | 'updatedAt' | 'messageCount' = 'updatedAt',
        order: 'asc' | 'desc' = 'desc'
    ): Conversation[] => {
        if (!isEnabled) return [];

        return [...conversations].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                case 'updatedAt':
                    aValue = new Date(a.updatedAt).getTime();
                    bValue = new Date(b.updatedAt).getTime();
                    break;
                case 'messageCount':
                    aValue = a.messageCount || 0;
                    bValue = b.messageCount || 0;
                    break;
                default:
                    return 0;
            }

            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }, [isEnabled]);

    return {
        searchConversations,
        filterConversations,
        sortConversations,
        isEnabled,
    };
} 