"use client";

import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAssistantRuntime } from "@assistant-ui/react";
import { io, Socket } from 'socket.io-client';
import { useCurrentState } from "@/app/AgentRuntimeProvider";

interface OAuthButtonProps {
  oauthUrl: string;
  shopDomain?: string;
  className?: string;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({ 
  oauthUrl, 
  shopDomain,
  className 
}) => {
  console.log("OAuthButton rendered with:", { oauthUrl, shopDomain });
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const runtime = useAssistantRuntime();
  
  // Get session ID from current state context (must be at top level)
  const currentState = useCurrentState();
  const contextSessionId = currentState.data?.sessionId;

  // Initialize socket connection and session
  useEffect(() => {
    // Use session ID from context or generate new one
    const newSessionId = contextSessionId || 'session_' + Math.random().toString(36).substr(2, 9);
    console.log('Using session ID from context:', newSessionId);
    setSessionId(newSessionId);
    
    // Initialize socket connection
    const socket = io('http://localhost:3001');
    socketRef.current = socket;
    
    // Add connection event listeners for debugging
    socket.on('connect', () => {
      console.log('Socket connected to server');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected from server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    // Listen for all events for debugging
    socket.onAny((event, ...args) => {
      console.log('Socket event received:', event, args);
    });
    
    // Join session
    socket.emit('join_session', newSessionId);
    console.log('Joined session:', newSessionId);
    
    // Listen for OAuth completion
    socket.on('oauth_completed', (data: any) => {
      console.log('🎉 OAuth completed via socket!', data);
      console.log('Session ID that completed:', newSessionId);
      setStatusMessage("✅ Successfully connected to Shopify!");
      setIsConnecting(false);
      setIsPopupOpen(false);
      
      // Close popup if it's still open
      try {
        const popup = window.open('', 'shopify-oauth');
        if (popup) {
          popup.close();
        }
      } catch (popupError) {
        console.warn("Could not close popup:", popupError);
      }
      
      // Send completion message to chat
      try {
        console.log('Sending oauth_completed message to chat runtime...');
        runtime.thread.append({
          role: "user",
          content: [{ type: "text", text: "oauth_completed" }],
        });
        console.log("✅ Sent oauth_completed message to chat");
      } catch (runtimeError) {
        console.error("❌ Error sending message to chat:", runtimeError);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
    });
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_session', newSessionId);
        socketRef.current.disconnect();
      }
    };
  }, [runtime, contextSessionId]);

  const handleOAuthClick = () => {
    if (!shopDomain || !sessionId) {
      console.error("Missing shopDomain or sessionId");
      setStatusMessage("❌ Missing required information for OAuth");
      setTimeout(() => setStatusMessage(null), 5000);
      return;
    }

    try {
      // Reset popup blocked state
      setPopupBlocked(false);
      setIsConnecting(true);
      setStatusMessage("⏳ Opening OAuth window...");
      
      // Extract shop name from shopDomain (remove .myshopify.com if present)
      const shopName = shopDomain.includes('.myshopify.com') 
        ? shopDomain.replace('.myshopify.com', '') 
        : shopDomain;
      
      // Use the oauthUrl prop, but convert relative paths to full localhost URLs
      let finalOAuthUrl = oauthUrl;
      if (oauthUrl.startsWith('/')) {
        // Replace the shop parameter in the URL with just the shop name and use our session ID
        const urlWithShopName = oauthUrl.replace(/shop=([^&]+)/, `shop=${encodeURIComponent(shopName)}`);
        const urlWithSessionId = urlWithShopName.replace(/sessionId=([^&]+)/, `sessionId=${sessionId}`);
        finalOAuthUrl = `http://localhost:3001${urlWithSessionId}`;
      }
      
      console.log("Original shopDomain:", shopDomain);
      console.log("Extracted shop name:", shopName);
      console.log("Original oauthUrl prop:", oauthUrl);
      console.log("Final OAuth URL:", finalOAuthUrl);
      
      // Open OAuth URL in a new tab
      const popup = window.open(finalOAuthUrl, '_blank', 'noopener,noreferrer');
      
      if (popup) {
        // New tab opened successfully
        setIsPopupOpen(true);
        setStatusMessage("⏳ Please complete the authorization in the new tab...");
        console.log("OAuth opened in new tab");
      } else {
        // Tab was blocked
        setPopupBlocked(true);
        setIsConnecting(false);
        setStatusMessage("❌ New tab was blocked. Please allow popups and try again.");
      }
    } catch (error) {
      console.error("Error opening OAuth popup:", error);
      setStatusMessage(`❌ Failed to open OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setStatusMessage(null), 5000);
      setPopupBlocked(true);
      setIsConnecting(false);
    }
  };

  return (
    <span className={`${className || ''}`}>
      <Button 
        onClick={handleOAuthClick}
        disabled={isPopupOpen || isConnecting}
        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors inline-block"
        size="sm"
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Connecting...
          </>
        ) : isPopupOpen ? (
          <>
            <ExternalLinkIcon className="w-4 h-4" />
            Opened...
          </>
        ) : (
          <>
            <ExternalLinkIcon className="w-4 h-4" />
            Connect to Shopify
          </>
        )}
      </Button>
      {isPopupOpen && (
        <span className="ml-2">
          <span className="text-sm text-gray-600">
            Please complete the authorization in the new tab.
          </span>
        </span>
      )}
      
      {/* Status message display */}
      {statusMessage && (
        <span className="mt-2 block text-sm">
          {statusMessage}
        </span>
      )}
      
      {/* Debug info */}
      <span className="mt-2 block text-xs text-gray-500">
        Shop Domain: {shopDomain || 'Not found'} | Session: {sessionId || 'Not set'}
      </span>
      {popupBlocked && (
        <span className="ml-2">
          <span className="text-sm text-red-600">
            Popup blocked. 
          </span>
          <Button 
            onClick={() => {
              const oauthUrl = `http://localhost:3001/agents/shopify/authorize?shop=${encodeURIComponent(shopDomain || '')}&sessionId=${sessionId}`;
              const popup = window.open(oauthUrl, '_blank', 'noopener,noreferrer');
              if (popup) {
                setIsPopupOpen(true);
                setStatusMessage("⏳ Please complete the authorization in the new tab...");
              }
            }}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            Open in New Tab
          </Button>
        </span>
      )}
      {isConnecting && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-blue-800 font-medium">
              Checking authorization status...
            </span>
          </div>
        </div>
      )}
    </span>
  );
};
