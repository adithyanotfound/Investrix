'use client';
/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

export function ChatToggleButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [botresponse, setBotresponse] = useState([
    { message: "Hello, I am Investrix. How can I help you?", type: "bot" },
  ]);

  const handleToggle = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const handleInputChange = useCallback((e: any) => {
    setInputValue(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();
      try {
        setBotresponse((prev) => [...prev, { message: inputValue, type: "user" }]);

        const response = await fetch(`${process.env.NEXT_PUBLIC_CHATBOT_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: inputValue }),
        });

        const data = await response.json();

        setBotresponse((prev) => [
          ...prev,
          { message: data.response || "Error: No response from server.", type: "bot" },
        ]);

        setInputValue("");
      } catch (error) {
        console.error("Fetch error:", error);
        setBotresponse((prev) => [
          ...prev,
          { message: "Error: Unable to reach the server.", type: "bot" },
        ]);
      }
    },
    [inputValue]
  );

  return (
    <>
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
              <h3 className="text-white font-medium">AI Assistant</h3>
            </div>
            <div className="p-4 h-[380px] overflow-y-auto">
              {botresponse.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 mb-2 max-w-[80%] ${
                    item.type === "bot" ? "bg-gray-100 text-gray-800" : "bg-green-500 text-white self-end"
                  }`}
                >
                  <p className="text-sm">{item.message}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.5 }}
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-white text-green-500 shadow-lg hover:shadow-xl transition-all duration-300 group"
      >
        <motion.div animate={{ rotate: isChatOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </>
  );
}
