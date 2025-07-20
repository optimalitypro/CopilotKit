import React from 'react';
import { 
  CopilotKit, 
  CopilotPopup,
  useCopilotConversationHistory,
  useCopilotCurrentConversation,
  useCopilotConversationActions,
  ConversationHistoryButton,
  ConversationList
} from '@copilotkit/react-ui';

// Simple conversation management component
function ConversationManager() {
  const { conversations, isLoading, error } = useCopilotConversationHistory();
  const { currentConversationId, switchToConversation } = useCopilotCurrentConversation();
  const { createNewConversation } = useCopilotConversationActions();

  if (!conversations) return null; // Not enabled

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem 0' }}>
      <h3>Conversation Management</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => createNewConversation()}>
          New Conversation
        </button>
        <ConversationHistoryButton />
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}

      <ConversationList 
        showSearch={true}
        showCreateButton={false} // Already have button above
        className="my-conversation-list"
      />

      {currentConversationId && (
        <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
          Current: {currentConversationId}
        </div>
      )}
    </div>
  );
}

// Main application component
function App() {
  // Conversation configuration
  const conversationConfig = {
    apiBaseUrl: process.env.REACT_APP_CONVERSATION_API || 'http://localhost:3000/api',
    userId: 'user-123', // In real app, get from auth
    headers: {
      'Authorization': 'Bearer your-token-here',
      'Content-Type': 'application/json'
    },
    autoSave: true
  };

  // Callback for conversation changes
  const handleConversationChange = ({ conversationId, conversation, previousConversationId }) => {
    console.log('Conversation changed:', {
      from: previousConversationId,
      to: conversationId,
      conversation
    });
    
    // Update URL or analytics
    if (conversationId) {
      window.history.pushState({}, '', `/chat/${conversationId}`);
    } else {
      window.history.pushState({}, '', '/chat');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>CopilotKit with Conversation Features</h1>
      
      <CopilotKit
        runtimeUrl="http://localhost:4000/copilotkit"
        conversationConfig={conversationConfig}
        onConversationChange={handleConversationChange}
        autoSaveMessages={true}
      >
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Sidebar with conversation management */}
          <div style={{ width: '300px' }}>
            <ConversationManager />
          </div>
          
          {/* Main chat area */}
          <div style={{ flex: 1 }}>
            <CopilotPopup
              instructions="You are a helpful assistant."
              labels={{
                title: "AI Assistant",
                initial: "Hi! How can I help you today?",
              }}
            />
          </div>
        </div>
      </CopilotKit>
    </div>
  );
}

export default App;

// Alternative: Using without conversation features (backward compatible)
function SimpleApp() {
  return (
    <CopilotKit runtimeUrl="http://localhost:4000/copilotkit">
      {/* No conversation config = no conversation features */}
      <CopilotPopup
        instructions="You are a helpful assistant."
        labels={{
          title: "Simple AI Assistant",
          initial: "Hi! How can I help you today?",
        }}
      />
    </CopilotKit>
  );
}

// Custom conversation UI component example
function CustomConversationExample() {
  const { conversations, isEnabled } = useCopilotConversationHistory();
  const { switchToConversation } = useCopilotCurrentConversation();

  if (!isEnabled) return null;

  return (
    <div>
      <h4>My Custom Conversation List</h4>
      {conversations.map(conversation => (
        <div 
          key={conversation.id}
          style={{ 
            padding: '0.5rem', 
            border: '1px solid #eee', 
            margin: '0.5rem 0',
            cursor: 'pointer' 
          }}
          onClick={() => switchToConversation(conversation.id)}
        >
          <strong>{conversation.title}</strong>
          <div style={{ fontSize: '0.8em', color: '#666' }}>
            {new Date(conversation.updatedAt).toLocaleDateString()}
          </div>
          {conversation.lastMessage && (
            <div style={{ fontSize: '0.8em', color: '#999' }}>
              {conversation.lastMessage.substring(0, 50)}...
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 