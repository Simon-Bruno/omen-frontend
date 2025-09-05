"use client";

import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";

interface OAuthButtonProps {
  oauthUrl: string;
  className?: string;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({ 
  oauthUrl, 
  className 
}) => {
  const handleOAuthClick = () => {
    // Open OAuth URL in a new tab
    window.open(oauthUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`mt-4 ${className || ''}`}>
      <Button 
        onClick={handleOAuthClick}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        size="lg"
      >
        <ExternalLinkIcon className="w-4 h-4" />
        Connect to Shopify
      </Button>
    </div>
  );
};
