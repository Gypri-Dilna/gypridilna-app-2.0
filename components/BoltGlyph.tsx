import React from 'react';

interface BoltGlyphChainProps {
    className?: string;
    opacity?: number;
}

export const BoltGlyphChain: React.FC<BoltGlyphChainProps> = ({ className = "h-8 w-auto", opacity = 0.8 }) => {
    return (
        <img 
            src="/assets/bolt_glyph_chain.svg" 
            alt="" 
            className={`select-none pointer-events-none ${className}`}
            style={{ opacity }}
        />
    );
};

export const BoltGlyph: React.FC<{ className?: string; opacity?: number }> = ({ className = "h-8 w-auto", opacity = 0.8 }) => {
    return (
        <img 
            src="/assets/bolt_glyph.svg" 
            alt="" 
            className={`select-none pointer-events-none ${className}`}
            style={{ opacity }}
        />
    );
};
