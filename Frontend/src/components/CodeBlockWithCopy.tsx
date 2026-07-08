/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import styles from './CodeBlockWithCopy.module.css';

export function CodeBlockWithCopy({ children }: { children: React.ReactNode }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        
        // 💡 Helper function to extract text strings out of deep React elements
        const extractText = (node: any): string => {
          if (!node) return '';
          if (typeof node === 'string') return node;
          if (typeof node === 'number') return node.toString();
        
          // If it's an array of elements (like paragraphs/spans), map and join them
          if (Array.isArray(node)) {
            return node.map(extractText).join('');
          }
        
          // If it's a nested React element, inspect its inner children props recursively
          if (node.props && node.props.children) {
            return extractText(node.props.children);
          }
          
          return '';
        };

        // 💡 Extract the final pure text block layout string safely
        const textToCopy = extractText(children);

    
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset text after 2 seconds
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
  };

  return (
      <div className={styles.codeBlockContainer}>
      {/* Copy Button styled to sit perfectly at the top right */}
          <button onClick={handleCopy} className={styles.copyCodeBtn}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      
      {/* The actual code block container */}
          <pre className={styles.customPre}>
        {children}
      </pre>
    </div>
  );
}