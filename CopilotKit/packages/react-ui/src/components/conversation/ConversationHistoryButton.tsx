import React from "react";
import { useCopilotConversationHistory } from "@copilotkit/react-core";

interface ConversationHistoryButtonProps {
  /**
   * Custom click handler for the history button
   */
  onClick?: () => void;
  
  /**
   * Custom icon for the button
   */
  icon?: React.ReactNode;
  
  /**
   * Button className
   */
  className?: string;
  
  /**
   * Button text/label
   */
  children?: React.ReactNode;
}

/**
 * A simple button component for opening conversation history.
 * Only renders when conversation features are enabled.
 */
export function ConversationHistoryButton({
  onClick,
  icon,
  className = "copilotkit-conversation-history-button",
  children = "History"
}: ConversationHistoryButtonProps) {
  const { isEnabled, isLoading, conversations } = useCopilotConversationHistory();
  
  // Don't render if conversation features are not enabled
  if (!isEnabled) {
    return null;
  }
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  const defaultIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
  
  return (
    <button
      onClick={handleClick}
      className={className}
      disabled={isLoading}
      title={`${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
    >
      {icon || defaultIcon}
      {children && <span>{children}</span>}
    </button>
  );
} 