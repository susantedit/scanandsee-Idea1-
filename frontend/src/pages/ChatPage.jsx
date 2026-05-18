import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import ChatInterface from '../components/chat/ChatInterface.jsx';
import SuggestedChips from '../components/chat/SuggestedChips.jsx';
import { askAI } from '../services/api.js';
import { getPersonalizedContext, getInsights } from '../services/aiMemory.js';
import useAppStore from '../store/useAppStore.js';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const scanId = searchParams.get('scanId');
  const { currentScan } = useAppStore();

  const [messages,    setMessages]    = useState([]);
  const [inputValue,  setInputValue]  = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const foodName = currentScan?.food_name;
    const insights = getInsights();
    let greeting = '';

    if (foodName) {
      greeting = `I've analyzed your ${foodName}. Ask me anything about it — nutrition, health risks, fitness suitability, or alternatives.`;
    } else if (insights.length > 0) {
      greeting = `Hi! Based on your recent scans — ${insights[0].toLowerCase()} Ask me anything about food, nutrition, or health.`;
    } else {
      greeting = `Hi! I'm your AI nutrition coach. Ask me anything about food, nutrition, or health.`;
    }

    setMessages([{ role: 'ai', content: greeting }]);
  }, [currentScan?.food_name]);

  const handleSend = async (question) => {
    if (!question.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
      // Inject AI memory so the AI knows your eating history
      const memoryContext = getPersonalizedContext();
      const questionWithMemory = memoryContext
        ? `${question}\n\n[MEMORY: ${memoryContext}]`
        : question;

      const response = await askAI(questionWithMemory, scanId || null);
      setMessages(prev => [...prev, { role: 'ai', content: response.answer }]);
      if (response.suggestions?.length) setSuggestions(response.suggestions);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I had trouble answering that. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Navbar showBack title="Ask AI" showSettings={false} />

      {currentScan?.food_name && (
        <div style={{ padding: 'var(--sp-2) var(--margin-mobile)', background: 'var(--primary-bg)', borderBottom: '1px solid rgba(0,230,57,0.2)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span className="text-label" style={{ color: 'var(--primary)', fontSize: 10 }}>CONTEXT:</span>
          <span className="text-body-sm" style={{ color: 'var(--on-surface-muted)' }}>
            {currentScan.food_name} — Score {currentScan.health_score}/10
          </span>
        </div>
      )}

      <SuggestedChips suggestions={suggestions} onSelect={(q) => { setInputValue(q); handleSend(q); }} />

      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 'var(--bottom-nav-h)' }}>
        <ChatInterface messages={messages} onSend={handleSend} isLoading={isLoading} inputValue={inputValue} setInputValue={setInputValue} />
      </div>

      <BottomNav />
    </div>
  );
}
