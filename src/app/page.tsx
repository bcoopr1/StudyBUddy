"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";

type Message = { 
  from: "user" | "bot"; 
  text: string; 
  timestamp: Date;
};



export default function ChatbotPage() {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ 
      top: scrollRef.current.scrollHeight, 
      behavior: "smooth" 
    });
  }, [chat, isTyping]);

  const send = async () => {
    const text = question.trim();
    if (!text) return;
    
    const userMessage: Message = { 
      from: "user", 
      text, 
      timestamp: new Date() 
    };
    
    setChat(prev => [...prev, userMessage]);
    setQuestion("");
    setIsTyping(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      
      const { answer } = await res.json();
      
      const botMessage: Message = { 
        from: "bot", 
        text: answer || "I'm here to help you study! Feel free to ask me anything about your coursework, upload documents for analysis, or get study tips.", 
        timestamp: new Date() 
      };
      
      setIsTyping(false);
      setChat(prev => [...prev, botMessage]);
    } catch (err) {
      setIsTyping(false);
      const errorMessage: Message = { 
        from: "bot", 
        text: "I'm here to help you study! Feel free to ask me anything about your coursework, upload documents for analysis, or get study tips.", 
        timestamp: new Date() 
      };
      setChat(prev => [...prev, errorMessage]);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTextWithKE = (text: string) => {
    // Replace "ke" with colored version - k in red, e in bright green
    return text.replace(/ke/gi, '<span style="color: #dc3545;">k</span><span style="color: #28a745;">e</span>');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        height: '90vh',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e1e5e9',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          background: '#1a5d1a',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ffd700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1a5d1a'
            }}>
              SB
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'white',
                margin: '0',
                letterSpacing: '-0.3px'
              }}>
                Study<span style={{ color: '#ffd700' }}>BU</span>ddy
              </h1>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '2px 0 0 0'
              }}>
                Why did the chicken cross the road?
              </p>
            </div>
          </div>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}>
            Upload
            <input
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Files */}
        {files.length > 0 && (
          <div style={{
            padding: '12px 24px',
            background: '#f8f9fa',
            borderBottom: '1px solid #e1e5e9'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {files.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: '#ffd700',
                    color: '#1a5d1a',
                    fontSize: '12px',
                    borderRadius: '16px',
                    fontWeight: '500'
                  }}
                >
                  {file.name}
                  <button
                    onClick={() => removeFile(idx)}
                    style={{
                      background: 'rgba(26, 93, 26, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '10px',
                      color: '#1a5d1a'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            background: 'white'
          }}
        >
          {chat.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              gap: '20px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#1a5d1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffd700'
              }}>
                SB
              </div>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1a5d1a',
                  margin: '0 0 8px 0'
                }}>
                  Welcome to Study<span style={{ color: '#ffd700' }}>BU</span>ddy!
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#666',
                  margin: '0 0 20px 0',
                  maxWidth: '400px'
                }}>
                  We gettin MONEY
                </p>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center'
              }}>
                {["Summarize a video", "Help with homework", "Search books", "What exams do we have?"].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuestion(suggestion)}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid #e1e5e9',
                      borderRadius: '20px',
                      fontSize: '14px',
                      color: '#666',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#1a5d1a';
                      e.currentTarget.style.color = '#1a5d1a';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e1e5e9';
                      e.currentTarget.style.color = '#666';
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chat.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
                  alignItems: 'flex-end'
                }}
              >
                {msg.from === "bot" && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#1a5d1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '10px',
                    flexShrink: 0,
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white'
                  }}>
                    SB
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '18px',
                    background: msg.from === "user" ? '#1a5d1a' : '#f1f3f4',
                    color: msg.from === "user" ? 'white' : '#333',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}
                  dangerouslySetInnerHTML={{ __html: formatTextWithKE(msg.text) }}
                  >
                  </div>
                  <span style={{
                    fontSize: '11px',
                    color: '#999',
                    marginTop: '4px',
                    textAlign: msg.from === "user" ? 'right' : 'left'
                  }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {msg.from === "user" && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ffd700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#1a5d1a',
                    flexShrink: 0
                  }}>
                    U
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-end'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#1a5d1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  SB
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: '#f1f3f4',
                  borderRadius: '18px'
                }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#999',
                      animation: 'bounce 1.4s infinite ease-in-out'
                    }}></div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#999',
                      animation: 'bounce 1.4s infinite ease-in-out 0.16s'
                    }}></div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#999',
                      animation: 'bounce 1.4s infinite ease-in-out 0.32s'
                    }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          padding: '16px 24px',
          background: 'white',
          borderTop: '1px solid #e1e5e9'
        }}>
          <div style={{ flex: 1 }}>
            <textarea
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                resize: 'none',
                borderRadius: '20px',
                border: '1px solid #e1e5e9',
                background: '#f8f9fa',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                minHeight: '44px',
                maxHeight: '100px'
              }}
              placeholder="Ask me anything about your studies..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={onKey}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a5d1a';
                e.target.style.background = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.background = '#f8f9fa';
              }}
            />
          </div>
          
          <button
            onClick={send}
            disabled={!question.trim() || isTyping}
            style={{
              padding: '12px',
              borderRadius: '50%',
              background: question.trim() && !isTyping ? '#1a5d1a' : '#ccc',
              border: 'none',
              cursor: question.trim() && !isTyping ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'white',
              transition: 'all 0.2s ease',
              width: '44px',
              height: '44px',
              fontWeight: '600'
            }}
          >
            →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          } 40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}