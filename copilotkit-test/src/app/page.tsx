"use client";


import { CopilotPopup, CopilotSidebar, CopilotChat } from "@copilotkit/react-ui";
import { CopilotKit, useCopilotAction, useCopilotReadable, useCopilotContext } from "@copilotkit/react-core";
import { useState, useEffect } from "react";

function TestComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<string[]>([]);

  // Test useCopilotReadable
  useCopilotReadable({
    description: "Current count value",
    value: count,
  });

  useCopilotReadable({
    description: "List of items",
    value: items,
  });

  // Test useCopilotAction
  useCopilotAction({
    name: "incrementCounter",
    description: "Increment the counter by a given amount",
    parameters: [
      {
        name: "amount",
        type: "number",
        description: "Amount to increment by",
        required: true,
      },
    ],
    handler: async ({ amount }) => {
      setCount(prev => prev + amount);
    },
  });

  useCopilotAction({
    name: "addItem",
    description: "Add an item to the list",
    parameters: [
      {
        name: "item",
        type: "string",
        description: "Item to add to the list",
        required: true,
      },
    ],
    handler: async ({ item }) => {
      setItems(prev => [...prev, item]);
    },
  });

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">CopilotKit Test App</h1>
      
      <div className="space-y-2">
        <p className="text-lg">Count: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Increment
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-lg">Items ({items.length}):</p>
        <ul className="list-disc list-inside">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <button 
          onClick={() => setItems(prev => [...prev, `Item ${prev.length + 1}`])}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Item
        </button>
      </div>

      <div className="text-sm text-gray-600">
        <p>Test the AI assistant by asking it to:</p>
        <ul className="list-disc list-inside ml-4">
          <li>Increment the counter by 5</li>
          <li>Add "Shopping" to the list</li>
          <li>What's the current count?</li>
          <li>How many items are in the list?</li>
        </ul>
      </div>
    </div>
  );
}

function AppContent() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1000); // Longer delay
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <TestComponent />
      <div className="p-4 text-sm text-gray-600">
        <p>CopilotPopup: {showPopup ? "✅ Ready" : "❌ Loading"}</p>
      </div>
      {showPopup && (
        <CopilotPopup
          instructions="You are a helpful assistant that can interact with the counter and items list. Help users increment the counter and manage their items."
          labels={{
            title: "CopilotKit Test Assistant",
            initial: "Hi! I can help you test CopilotKit features."
          }}
        />
      )}
    </>
  );
}

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="react_agent">
      <AppContent />
    </CopilotKit>
      
  );
}
