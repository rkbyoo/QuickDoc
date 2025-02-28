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
  const hasSentInitialMessage = useRef(false); // Track initial message

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log("Received message:", event.data);
      setIsTyping(false);

      if (event.data === "ping") {
        ws.send("pong");
        return;
      }

      const text =
        typeof event.data === "string"
          ? event.data
          : JSON.stringify(event.data);
      if (
        text ===
        "Hi! I’m here to help you book an appointment. What’s your name?"
      ) {
        if (hasSentInitialMessage.current) {
          console.log("Ignoring duplicate initial message");
          return; // Skip if already added
        }
        hasSentInitialMessage.current = true;
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "bot",
          text,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      hasSentInitialMessage.current = false; // Reset for reconnection
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    inputRef.current?.focus();
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

      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex items-center gap-2">
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
    </div>
  );
};

export default ChatBot;
