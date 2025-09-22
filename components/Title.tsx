"use client";

import { RefObject, useRef, useState } from "react";

export default function Title() {
  const johannaRef = useRef<HTMLAudioElement | null>(null);
  const kevinRef = useRef<HTMLAudioElement | null>(null);
  const [isJohannaGreen, setIsJohannaGreen] = useState(false);
  const [isKevinFading, setIsKevinFading] = useState(false);

  const handlePlay = (ref: RefObject<HTMLAudioElement | null>) => {
    if (ref.current) {
      ref.current.currentTime = 0; // remet au début
      ref.current.play();
    }
  };

  const handleJohannaClick = () => {
    handlePlay(johannaRef);
    setIsJohannaGreen(true);
    setTimeout(() => {
      setIsJohannaGreen(false);
    }, 2000);
  };

  const handleKevinClick = () => {
    handlePlay(kevinRef);
    setIsKevinFading(true);
    setTimeout(() => {
      setIsKevinFading(false);
    }, 2000);
  };

  return (
    <div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fadeInOut {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
        `,
        }}
      />
      <h1 className="text-5xl font-bold space-x-2">
        <button
          onClick={handleJohannaClick}
          className={`transition-all duration-200 ${
            isJohannaGreen
              ? "text-[#075b15]"
              : "bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
          }`}
        >
          Johanna
        </button>
        <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          &
        </span>
        <button
          onClick={handleKevinClick}
          className={`bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent ${
            isKevinFading ? "animate-fade-in-out" : ""
          }`}
          style={{
            animation: isKevinFading ? "fadeInOut 2s ease-in-out" : "none",
          }}
        >
          Kevin
        </button>
      </h1>
      <audio ref={johannaRef} src="/pet.mp3" />
      <audio ref={kevinRef} src="/revelio.mp3" />
    </div>
  );
}
