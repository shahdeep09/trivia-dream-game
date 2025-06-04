
import React from "react";

interface GameStartScreenProps {
  teamName: string;
}

const GameStartScreen = ({ teamName }: GameStartScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-millionaire-gold mb-4">Ready to Play?</h2>
        <p className="text-xl text-millionaire-light mb-8">
          Press the Start Game button when you're ready to begin!
        </p>
        {teamName && (
          <p className="text-lg text-millionaire-accent">
            Playing as: <span className="font-bold text-millionaire-gold">{teamName}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default GameStartScreen;
