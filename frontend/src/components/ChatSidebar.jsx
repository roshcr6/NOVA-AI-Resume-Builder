import { useState } from 'react';
import Loader from './Loader';

function ChatSidebar({ resumeId, onEdit, isOpen, onToggle, embedded = false }) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setIsLoading(true);

    try {
      const result = await onEdit(resumeId, userMessage);
      
      // Generate a helpful response based on the instruction
      let responseMsg = 'Resume updated successfully! ';
      const lowerMsg = userMessage.toLowerCase();
      
      if (lowerMsg.includes('add') && lowerMsg.includes('skill')) {
        responseMsg += 'Skills have been added to your resume.';
      } else if (lowerMsg.includes('color') || lowerMsg.includes('blue') || lowerMsg.includes('red')) {
        responseMsg += 'The color scheme has been updated. Check the PDF preview!';
      } else if (lowerMsg.includes('spacing') || lowerMsg.includes('compact') || lowerMsg.includes('tighter')) {
        responseMsg += 'Spacing has been adjusted. Check the PDF preview!';
      } else if (lowerMsg.includes('rewrite') || lowerMsg.includes('improve') || lowerMsg.includes('enhance')) {
        responseMsg += 'Content has been rewritten with more impact.';
      } else if (lowerMsg.includes('ats') || lowerMsg.includes('keywords')) {
        responseMsg += 'ATS optimization completed with relevant keywords.';
      } else {
        responseMsg += 'Changes have been applied. Check the preview on the right.';
      }
      
      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: responseMsg
      }]);
    } catch (error) {
      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message || 'Failed to update resume'}. Please try rephrasing your request.`,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    'Add Python and JavaScript to my skills',
    'Make my summary more impactful and quantifiable',
    'Rewrite experience to focus on achievements',
    'Add more technical keywords for ATS',
    'Change the color to blue',
    'Make it more compact with tighter spacing'
  ];

  if (!isOpen) {
    return null;
  }

  // When embedded, only render the chat content (no wrapper/fixed positioning)
  const chatContent = (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-400 mb-4">Ask me to edit your resume!</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Try:</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(suggestion)}
                  className="block w-full text-left px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-white/10"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : msg.isError
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/10 text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-4 py-3 rounded-lg">
              <Loader size="sm" text="" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 shrink-0">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your edit request..."
            className="flex-1 input-field"
            disabled={isLoading || !resumeId}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading || !resumeId}
            className="btn-primary px-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        {!resumeId && (
          <p className="text-xs text-gray-500 mt-2">Generate a resume first to enable editing</p>
        )}
      </form>
    </>
  );

  // If embedded, return just the content without wrapper
  if (embedded) {
    return chatContent;
  }

  // Otherwise return the fixed sidebar layout
  return (
    <div className="fixed right-0 top-16 bottom-0 w-96 bg-[#0f0f0f] shadow-xl border-l border-white/10 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">AI Edit Assistant</h3>
        <button onClick={onToggle} className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {chatContent}
    </div>
  );
}

export default ChatSidebar;
