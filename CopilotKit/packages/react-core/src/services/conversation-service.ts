import { Message, MessageRole, Role, TextMessage } from "@copilotkit/runtime-client-gql";
import {
    ConversationConfig,
    Conversation,
    ConversationMessage
} from "../types/conversation";

/**
 * Service class for managing conversation API interactions
 */
export class ConversationService {
    private config: ConversationConfig;

    constructor(config: ConversationConfig) {
        this.config = {
            autoSave: true,
            endpoints: {
                conversations: '/conversations',
                messages: '/messages',
                create: '/conversations',
                delete: '/conversations'
            },
            ...config
        };
    }

    /**
     * Get all conversations for the current user
     */
    async getConversations(): Promise<Conversation[]> {
        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}${this.config.endpoints!.conversations}?userId=${this.config.userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.config.headers
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch conversations: ${response.statusText}`);
            }

            const conversations = await response.json();
            return Array.isArray(conversations) ? conversations : [];
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    }

    /**
     * Get messages for a specific conversation
     */
    async getConversationMessages(conversationId: string): Promise<Message[]> {
        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}${this.config.endpoints!.conversations}/${conversationId}/messages`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.config.headers
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch conversation messages: ${response.statusText}`);
            }

            const apiMessages: ConversationMessage[] = await response.json();
            return this.convertApiMessagesToCopilotMessages(apiMessages);
        } catch (error) {
            console.error('Error fetching conversation messages:', error);
            throw error;
        }
    }

    /**
     * Create a new conversation
     */
    async createConversation(title?: string): Promise<string> {
        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}${this.config.endpoints!.create}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.config.headers
                    },
                    body: JSON.stringify({
                        userId: this.config.userId,
                        title: title || `Conversation ${new Date().toLocaleString()}`
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to create conversation: ${response.statusText}`);
            }

            const result = await response.json();
            return result.id || result.conversationId || result._id;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    /**
     * Delete a conversation
     */
    async deleteConversation(conversationId: string): Promise<void> {
        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}${this.config.endpoints!.delete}/${conversationId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.config.headers
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete conversation: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }

    /**
     * Save a message to a conversation
     */
    async saveMessage(message: Message, conversationId: string): Promise<void> {
        if (!this.config.autoSave) {
            return;
        }

        try {
            const apiMessage = this.convertCopilotMessageToApiMessage(message, conversationId);

            const response = await fetch(
                `${this.config.apiBaseUrl}${this.config.endpoints!.conversations}/${conversationId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.config.headers
                    },
                    body: JSON.stringify(apiMessage)
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to save message: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error saving message:', error);
            // Don't throw error for save failures to avoid disrupting chat flow
        }
    }

    /**
     * Update conversation metadata
     */
    async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}${this.config.endpoints!.conversations}/${conversationId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.config.headers
                    },
                    body: JSON.stringify(updates)
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update conversation: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating conversation:', error);
            throw error;
        }
    }

    /**
     * Convert API messages to CopilotKit message format
     */
    private convertApiMessagesToCopilotMessages(apiMessages: ConversationMessage[]): Message[] {
        return apiMessages.map(apiMessage => {
            const role = this.mapApiRoleToCopilotRole(apiMessage.role);

            // Create appropriate message type based on metadata
            if (apiMessage.messageMetadata?.type === 'text' || !apiMessage.messageMetadata) {
                return new TextMessage({
                    id: apiMessage.id,
                    content: apiMessage.content,
                    role: role,
                    createdAt: new Date(apiMessage.createdAt)
                });
            }

            // For now, default to TextMessage for all types
            // TODO: Add support for other message types (ActionExecutionMessage, etc.)
            return new TextMessage({
                id: apiMessage.id,
                content: apiMessage.content,
                role: role,
                createdAt: new Date(apiMessage.createdAt)
            });
        });
    }

    /**
 * Convert CopilotKit message to API message format
 */
    private convertCopilotMessageToApiMessage(
        message: Message,
        conversationId: string
    ): Omit<ConversationMessage, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            conversationId,
            userId: this.config.userId,
            role: this.mapCopilotRoleToApiRole(this.getMessageRole(message)),
            content: this.extractMessageContent(message),
            messageMetadata: {
                type: this.getMessageType(message),
                messageId: message.id,
                originalMessage: message
            }
        };
    }

    /**
     * Get the role from a message (handling different message types)
     */
    private getMessageRole(message: Message): MessageRole {
        if (message.isTextMessage()) {
            return message.role;
        }
        if (message.isAgentStateMessage()) {
            return message.role;
        }
        if (message.isImageMessage()) {
            return message.role;
        }
        // Default for action and result messages
        return MessageRole.Assistant;
    }

    /**
     * Map API role to CopilotKit role
     */
    private mapApiRoleToCopilotRole(apiRole: string): MessageRole {
        switch (apiRole.toLowerCase()) {
            case 'user':
                return MessageRole.User;
            case 'assistant':
                return MessageRole.Assistant;
            case 'system':
                return MessageRole.System;
            default:
                return MessageRole.User;
        }
    }

    /**
     * Map CopilotKit role to API role
     */
    private mapCopilotRoleToApiRole(copilotRole: MessageRole): 'user' | 'assistant' | 'system' {
        switch (copilotRole) {
            case MessageRole.User:
                return 'user';
            case MessageRole.Assistant:
                return 'assistant';
            case MessageRole.System:
                return 'system';
            default:
                return 'user';
        }
    }

    /**
     * Extract content from different message types
     */
    private extractMessageContent(message: Message): string {
        if (message.isTextMessage()) {
            return message.content;
        }

        if (message.isActionExecutionMessage()) {
            return `Action: ${message.name}`;
        }

        if (message.isResultMessage()) {
            return `Result: ${message.result}`;
        }

        if (message.isAgentStateMessage()) {
            return `Agent State: ${message.agentName}`;
        }

        if (message.isImageMessage()) {
            return '[Image Message]';
        }

        return 'Unknown message type';
    }

    /**
     * Get message type for metadata
     */
    private getMessageType(message: Message): string {
        if (message.isTextMessage()) return 'text';
        if (message.isActionExecutionMessage()) return 'action';
        if (message.isResultMessage()) return 'result';
        if (message.isAgentStateMessage()) return 'agent_state';
        if (message.isImageMessage()) return 'image';
        return 'unknown';
    }
}

/**
 * Create a ConversationService instance
 */
export function createConversationService(config: ConversationConfig): ConversationService {
    return new ConversationService(config);
} 