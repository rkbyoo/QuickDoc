import React, { useState, useEffect, useRef } from "react";
import { Send, Calendar, User, Bot, Loader2 } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Connect to WebSocket server
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      setIsTyping(false);
      try {
        const data = JSON.parse(event.data);

        // Handle keep-alive ping
        if (data === "ping" || data.text === "ping") {
          ws.send("pong"); // Respond to keep-alive ping
          return;
        }

        // Add valid chat messages to the state
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "bot",
            text: data.text || data.message || data,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        // Handle plain text messages
        if (event.data === "ping") {
          ws.send("pong"); // Respond to keep-alive ping
          return;
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "bot",
            text: event.data,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    if (
      inputText.trim() === "" ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    )
      return;

    const newMessage: Message = {
      sender: "user",
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    socket.send(JSON.stringify({ text: inputText }));
    setInputText("");
    setIsTyping(true);

    // Focus back on input after sending
    inputRef.current?.focus();
  };

  const handleReschedule = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({ action: "reschedule" }));
    setIsTyping(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[650px]">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center border-b border-gray-700">
        <div className="bg-blue-600 p-2 rounded-full mr-3">
          <Bot size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white">DocChat</h2>
          <p className="text-gray-400 text-sm">
            {isConnected ? "Connected to medical assistant" : "Connecting..."}
          </p>
        </div>
        <div
          className={`h-3 w-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-800 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {messages.length === 0 && isConnected && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Bot size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Welcome to DocChat</p>
              <p className="text-sm">Your medical assistant is ready to help</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-6 ${message.sender === "user" ? "ml-12" : "mr-12"}`}
          >
            <div className="flex items-start">
              {message.sender === "bot" && (
                <div className="bg-blue-600 p-2 rounded-full mr-3 mt-1">
                  <Bot size={18} className="text-white" />
                </div>
              )}

              <div
                className={`flex-1 p-4 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>

              {message.sender === "user" && (
                <div className="bg-gray-600 p-2 rounded-full ml-3 mt-1">
                  <User size={18} className="text-white" />
                </div>
              )}
            </div>
            <div
              className={`text-xs text-gray-500 mt-1 ${
                message.sender === "user" ? "text-right" : "text-left ml-10"
              }`}
            >
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="mb-6 mr-12">
            <div className="flex items-start">
              <div className="bg-blue-600 p-2 rounded-full mr-3 mt-1">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-gray-700 text-gray-200 p-4 rounded-2xl flex items-center">
                <Loader2 size={18} className="animate-spin mr-2" />
                <span>Typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReschedule}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg flex items-center transition-colors"
            title="Reschedule appointment"
          >
            <Calendar size={18} className="mr-2" />
            <span>Reschedule</span>
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full p-3 pr-12 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={inputText.trim() === ""}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed p-1"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* <p className="text-gray-500 mt-10 text-sm text-center mx-auto max-w-md p-4">
        Connect with our AI medical assistant to schedule, reschedule, or manage your doctor appointments.
        All conversations are private and secure.
      </p> */}
    </div>
  );
};

export default ChatBot;
