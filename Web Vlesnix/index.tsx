/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {GoogleGenAI, Chat} from '@google/genai';
import {useEffect, useState, useRef} from 'react';
import ReactDOM from 'react-dom/client';

// Define the structure for a chat message
type Message = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  // Initialize the Gemini AI model and chat session
  useEffect(() => {
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
      });
    } catch (error) {
        console.error("Failed to initialize Gemini:", error);
        // Display an error message to the user in the chat
        setMessages([{
            role: 'model',
            parts: [{text: 'Error: Could not initialize the AI model. Please check the API key and configuration.'}]
        }]);
    }
  }, []);
  
  // Auto-scroll to the bottom of the message list when new messages are added
  useEffect(() => {
    if (messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = { role: 'user', parts: [{ text: userInput }] };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setUserInput('');

    try {
      const stream = await chatRef.current.sendMessageStream({ message: userInput });
      
      let modelResponse = '';
      // Add a placeholder for the model's response
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        // Update the last message (the model's response) with the streaming content
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].parts[0].text = modelResponse;
          return newMessages;
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage : Message = {
          role: 'model',
          parts: [{ text: 'Sorry, something went wrong. Please try again.' }]
      };
      // Replace the loading indicator with an error message
      setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = errorMessage;
          return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">Gemini Chat</div>
      <div className="message-list" ref={messageListRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}-message`}>
            {msg.parts[0].text}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
             <div className="message model-message loading-indicator">Thinking...</div>
        )}
      </div>
      <form className="chat-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          aria-label="Chat input"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !userInput.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
