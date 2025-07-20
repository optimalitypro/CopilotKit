import React, { useState } from "react";
import { 
  useCopilotConversationHistory, 
  useCopilotCurrentConversation,
  useCopilotConversationActions,
  useCopilotConversationSearch,
  type Conversation 
} from "@copilotkit/react-core";

interface ConversationListProps {
  /**
   * Custom className for the list container
   */
  className?: string;
  
  /**
   * Custom conversation item renderer
   */
  renderConversation?: (conversation: any, options: {
    isActive: boolean;
    onSelect: () => void;
    onDelete: (event: React.MouseEvent) => void;
  }) => React.ReactNode;
  
  /**
   * Whether to show search functionality
   */
  showSearch?: boolean;
  
  /**
   * Whether to show create new conversation button
   */
  showCreateButton?: boolean;
  
  /**
   * Custom labels
   */
  labels?: {
    search?: string;
    createNew?: string;
    noConversations?: string;
    loading?: string;
    delete?: string;
  };
}

/**
 * A list component for displaying and managing conversations.
 * Only renders when conversation features are enabled.
 */
export function ConversationList({
  className = "copilotkit-conversation-list",
  renderConversation,
  showSearch = true,
  showCreateButton = true,
  labels = {}
}: ConversationListProps) {
  const { conversations, isLoading, error, isEnabled, refresh } = useCopilotConversationHistory();
  const { currentConversationId, switchToConversation } = useCopilotCurrentConversation();
  const { createNewConversation, removeConversation } = useCopilotConversationActions();
  const { searchConversations, sortConversations } = useCopilotConversationSearch();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Don't render if conversation features are not enabled
  if (!isEnabled) {
    return null;
  }
  
  const defaultLabels = {
    search: "Search conversations...",
    createNew: "New Conversation",
    noConversations: "No conversations found",
    loading: "Loading conversations...",
    delete: "Delete",
    ...labels,
  };
  
  // Filter and sort conversations
  const filteredConversations = searchQuery 
    ? searchConversations(searchQuery)
    : conversations;
  const sortedConversations = sortConversations(filteredConversations, 'updatedAt', 'desc');
  
  const handleCreateNew = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const conversationId = await createNewConversation();
      if (conversationId) {
        await switchToConversation(conversationId);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDelete = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await removeConversation(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };
  
  const defaultConversationRenderer = (conversation: any, options: {
    isActive: boolean;
    onSelect: () => void;
    onDelete: (event: React.MouseEvent) => void;
  }) => (
    <div
      key={conversation.id}
      className={`copilotkit-conversation-item ${options.isActive ? 'active' : ''}`}
      onClick={options.onSelect}
    >
      <div className="copilotkit-conversation-content">
        <div className="copilotkit-conversation-title">{conversation.title}</div>
        {conversation.lastMessage && (
          <div className="copilotkit-conversation-preview">
            {conversation.lastMessage.length > 50 
              ? `${conversation.lastMessage.substring(0, 50)}...`
              : conversation.lastMessage
            }
          </div>
        )}
        <div className="copilotkit-conversation-meta">
          {new Date(conversation.updatedAt).toLocaleDateString()}
          {conversation.messageCount && (
            <span className="copilotkit-conversation-count">
              {conversation.messageCount} messages
            </span>
          )}
        </div>
      </div>
      <button
        className="copilotkit-conversation-delete"
        onClick={options.onDelete}
        title={defaultLabels.delete}
      >
        ×
      </button>
    </div>
  );
  
  if (isLoading && conversations.length === 0) {
    return (
      <div className={className}>
        <div className="copilotkit-conversation-loading">
          {defaultLabels.loading}
        </div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {showSearch && (
        <div className="copilotkit-conversation-search">
          <input
            type="text"
            placeholder={defaultLabels.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="copilotkit-conversation-search-input"
          />
        </div>
      )}
      
      {showCreateButton && (
        <button
          onClick={handleCreateNew}
          disabled={isCreating}
          className="copilotkit-conversation-create-button"
        >
          {isCreating ? "Creating..." : defaultLabels.createNew}
        </button>
      )}
      
      {error && (
        <div className="copilotkit-conversation-error">
          Error: {error}
          <button onClick={refresh} className="copilotkit-conversation-retry">
            Retry
          </button>
        </div>
      )}
      
      <div className="copilotkit-conversation-items">
        {sortedConversations.length === 0 ? (
          <div className="copilotkit-conversation-empty">
            {defaultLabels.noConversations}
          </div>
        ) : (
          sortedConversations.map((conversation) => {
            const isActive = conversation.id === currentConversationId;
            const handleSelect = () => switchToConversation(conversation.id);
            const handleDeleteClick = (event: React.MouseEvent) => handleDelete(conversation.id, event);
            
            return renderConversation ? (
              renderConversation(conversation, {
                isActive,
                onSelect: handleSelect,
                onDelete: handleDeleteClick,
              })
            ) : (
              defaultConversationRenderer(conversation, {
                isActive,
                onSelect: handleSelect,
                onDelete: handleDeleteClick,
              })
            );
          })
        )}
      </div>
    </div>
  );
} 