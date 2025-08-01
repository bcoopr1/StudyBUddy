"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";

type Message = { from: "user" | "bot"; text: string };

export default function Home() {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const send = async () => {
    const text = question.trim();
    if (!text) return;
    // add user message
    setChat((prev) => [...prev, { from: "user", text }]);
    setQuestion("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const { answer } = await res.json();
      // add bot message
      setChat((prev) => [...prev, { from: "bot", text: answer }]);
    } catch (err) {
      console.error(err);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Study Buddy
        </h1>
      </header>

      {/* Chat window */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100"
      >
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[75%] break-words px-4 py-2 rounded-lg shadow-sm
              ${msg.from === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-white text-gray-800"}`}
          >
            <span className="block text-sm">
              {msg.text}
            </span>
          </div>
        ))}
      </main>

      {/* Input area */}
      <footer className="bg-white py-4 px-6 shadow-inner flex items-center space-x-3">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your question and hit Enter..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKey}
        />
        <button
          onClick={send}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
        >
          Send
        </button>
      </footer>
    </div>
  );
}