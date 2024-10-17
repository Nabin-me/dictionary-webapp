// MyDictionary.tsx
"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Search, Speaker } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export interface DictionaryEntry {
  word: string;
  definition: string;
  pronunciation?: string;
  audioUrl?: string;
}

interface MyDictionaryProps {
  apiKey: string;
  apiUrl: string;
  title?: string;
  className?: string;
  onWordSelect?: (entry: DictionaryEntry) => void;
}

export function MyDictionary({
  apiKey,
  apiUrl,
  className = "",
  onWordSelect,
}: MyDictionaryProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(
    null
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const animationTimer = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prevIndex) =>
        prevIndex < results.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : prevIndex
      );
    } else if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      const selectedEntry = results[selectedIndex];
      handleCardClick(selectedEntry);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const fetchWordDefinitions = async (
    word: string
  ): Promise<DictionaryEntry[]> => {
    try {
      const response = await fetch(`${apiUrl}/${word}?key=${apiKey}`);
      const data = await response.json();

      if (
        data.length === 0 ||
        !data[0].shortdef ||
        data[0].shortdef.length === 0
      ) {
        return [
          {
            word: word,
            definition: "No definition available",
            pronunciation: undefined,
          },
        ];
      }

      // Use only the first entry
      const entry = data[0];
      const audioBaseUrl = "https://media.merriam-webster.com/soundc11";
      const audioFilename = entry.hwi?.prs?.[0]?.sound?.audio;
      const audioUrl = audioFilename
        ? `${audioBaseUrl}/${audioFilename[0]}/${audioFilename}.wav`
        : undefined;

      return [
        {
          word: entry.meta?.id.split(":")[0] || word,
          definition: entry.shortdef?.[0] || "No definition available",
          pronunciation: entry.hwi?.prs?.[0]?.mw || undefined,
          audioUrl,
        },
      ];
    } catch (error) {
      console.error("Error fetching definitions:", error);
      return [
        {
          word: word,
          definition: "Error fetching definition",
          pronunciation: undefined,
        },
      ];
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
    setPlayingAudio(audioUrl);
    audio.onended = () => setPlayingAudio(null);
  };

  const handleCardClick = (entry: DictionaryEntry) => {
    setSelectedEntry(entry);
    onWordSelect?.(entry);
  };

  useEffect(() => {
    const searchWord = async () => {
      if (searchTerm.trim()) {
        setIsLoading(true);
        setIsAnimating(true);

        try {
          const wordData = await fetchWordDefinitions(searchTerm.trim());
          await new Promise((resolve) => {
            animationTimer.current = setTimeout(resolve, 500);
          });
          setResults(wordData);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        }

        setIsLoading(false);
        setTimeout(() => setIsAnimating(false), 100);
      } else {
        setResults([]);
        setIsAnimating(false);
      }
    };

    const debounceTimer = setTimeout(searchWord, 300);
    return () => {
      clearTimeout(debounceTimer);
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, [searchTerm, apiKey, apiUrl]);

  return (
    <div className={`bg-white text-gray-900 flex flex-col ${className}`}>
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <motion.div
          className="flex flex-col items-center w-full max-w-3xl"
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Image
            src="/images/logo.png"
            alt="logo"
            width={1000}
            height={1000}
            className="w-[150px]"
          />
          <h1 className="mt-2 text-6xl font-bold tracking-tighter text-[#3A91CE]">
            Vocabulicious
          </h1>
          <h2 className="text-xl mb-8 max-w-lg text-center text-gray-500 ">
            Get deliciously defined!
          </h2>

          <div className="w-full">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for words (Ctrl+K)"
                className="w-full pr-4 py-8 rounded-xl shadow border border-[#e6e6e6] text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={searchInputRef}
              />
              <Search
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={32}
              />
            </div>

            <AnimatePresence mode="wait">
              {isLoading || isAnimating ? (
                <motion.div
                  key="shimmer"
                  className="mt-2 space-y-4 w-full bg-[#FDFDFD] border border-[#E7E7E7] shadow p-2 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </motion.div>
              ) : results.length > 0 ? (
                <motion.div
                  key="results"
                  className="mt-2 space-y-2 w-full bg-[#FDFDFD] border border-[#E7E7E7] shadow p-2 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {results.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-4 rounded-lg flex justify-between items-start cursor-pointer hover:bg-gray-100 transition-colors ${
                        index === selectedIndex ? "bg-gray-100" : ""
                      }`}
                      onClick={() => handleCardClick(result)}
                    >
                      <div>
                        <h2 className="font-semibold text-lg">{result.word}</h2>
                        {result.pronunciation && (
                          <p className="text-sm text-gray-500 mb-1">
                            /{result.pronunciation}/
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {result.definition}
                        </p>
                        {result.audioUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(result.audioUrl!);
                            }}
                            className="mt-2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <Speaker
                              size={20}
                              className={
                                playingAudio === result.audioUrl
                                  ? "text-blue-500"
                                  : ""
                              }
                            />
                          </button>
                        )}
                      </div>
                      <div className="text-gray-400 text-xl">→</div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
