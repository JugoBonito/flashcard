'use client';

import React from 'react';

interface MediaCardContentProps {
  content: string;
  className?: string;
}

export function MediaCardContent({ content, className }: MediaCardContentProps) {
  // Function to render content with proper media handling
  const renderContent = () => {
    // Check if content contains HTML elements
    if (content.includes('<') && content.includes('>')) {
      return (
        <div 
          className={`media-card-content ${className || ''}`}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal'
          }}
        />
      );
    }
    
    // Plain text content
    return (
      <div className={className || ''} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {content}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <style jsx>{`
        .media-card-content img {
          max-width: 100%;
          max-height: 200px;
          height: auto;
          border-radius: 6px;
          margin: 6px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: block;
        }
        
        @media (min-width: 640px) {
          .media-card-content img {
            max-height: 300px;
            border-radius: 8px;
            margin: 8px 0;
          }
        }
        
        .media-card-content audio {
          width: 100%;
          max-width: 100%;
          margin: 6px 0;
          border-radius: 4px;
        }
        
        @media (min-width: 640px) {
          .media-card-content audio {
            max-width: 300px;
            margin: 8px 0;
          }
        }
        
        .media-card-content audio::-webkit-media-controls-panel {
          background-color: #f5f5f5;
        }
        
        .media-card-content video {
          max-width: 100%;
          max-height: 200px;
          border-radius: 6px;
          margin: 6px 0;
        }
        
        @media (min-width: 640px) {
          .media-card-content video {
            max-height: 300px;
            border-radius: 8px;
            margin: 8px 0;
          }
        }
        
        .media-card-content hr {
          margin: 16px 0;
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.2);
          opacity: 0.6;
        }
        
        .media-card-content ul, .media-card-content ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        .media-card-content li {
          margin: 4px 0;
        }
        
        .media-card-content strong, .media-card-content b {
          font-weight: 600;
        }
        
        .media-card-content em, .media-card-content i {
          font-style: italic;
        }
        
        .media-card-content u {
          text-decoration: underline;
        }
        
        .media-card-content sub {
          vertical-align: sub;
          font-size: smaller;
        }
        
        .media-card-content sup {
          vertical-align: super;
          font-size: smaller;
        }
        
        .media-card-content table {
          border-collapse: collapse;
          margin: 8px 0;
          width: 100%;
        }
        
        .media-card-content td, .media-card-content th {
          border: 1px solid rgba(0, 0, 0, 0.2);
          padding: 8px;
        }
        
        .media-card-content th {
          background-color: rgba(0, 0, 0, 0.05);
          font-weight: 600;
        }
        
        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
          .media-card-content img {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          
          .media-card-content audio::-webkit-media-controls-panel {
            background-color: #2a2a2a;
          }
          
          .media-card-content hr {
            border-top-color: rgba(255, 255, 255, 0.2);
          }
          
          .media-card-content td, .media-card-content th {
            border-color: rgba(255, 255, 255, 0.2);
          }
          
          .media-card-content th {
            background-color: rgba(255, 255, 255, 0.05);
          }
        }
      `}</style>
    </>
  );
}