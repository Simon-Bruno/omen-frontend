"use client";

import React from 'react';
import { useChatContext } from './ChatProvider';
import { Button } from '@/components/ui/button';
import { PlusIcon, XIcon } from 'lucide-react';

export const SessionControls: React.FC = () => {
  const { 
    sessionId, 
    isLoading, 
    createNewSession, 
    closeSession
  } = useChatContext();

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-50 border-b">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Session:</span>
        <code className="text-xs bg-gray-200 px-2 py-1 rounded">
          {sessionId ? sessionId.slice(0, 8) + '...' : 'None'}
        </code>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={createNewSession}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" />
          New Session
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={closeSession}
          disabled={isLoading || !sessionId}
          className="flex items-center gap-1 text-red-600 hover:text-red-700"
        >
          <XIcon className="h-4 w-4" />
          Close
        </Button>
      </div>
    </div>
  );
};
