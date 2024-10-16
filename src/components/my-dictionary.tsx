"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = process.env.NEXT_PUBLIC_DICTIONARY_API_KEY;
const API_URL = process.env.NEXT_PUBLIC_DICTIONARY_API_URL;

interface DictionaryEntry {
  word: string;
  definition: string;
  pronunciation?: string;
}

export function MyDictionary() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchWordDefinitions = async (
    word: string
  ): Promise<DictionaryEntry[]> => {
    try {
      const response = await fetch(`${API_URL}/${word}?key=${API_KEY}`);
      const data = await response.json();

      if (
        data.length === 0 ||
        !data[0].shortdef ||
        data[0].shortdef.length === 0
      ) {
        // Return only one card if no definition is available
        return [
          {
            word: word,
            definition: "No definition available",
            pronunciation: undefined,
          },
        ];
      }

      return data.slice(0, 3).map((entry: any) => ({
        word: entry.meta?.id || word,
        definition: entry.shortdef?.[0] || "No definition available",
        pronunciation: entry.hwi?.prs?.[0]?.mw || undefined,
      }));
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prevIndex) =>
          prevIndex < results.length - 1 ? prevIndex + 1 : prevIndex
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex
        );
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown as unknown as EventListener
    );
    return () =>
      document.removeEventListener(
        "keydown",
        handleKeyDown as unknown as EventListener
      );
  }, [results, selectedIndex]);

  useEffect(() => {
    const searchWord = async () => {
      if (searchTerm.trim()) {
        setIsLoading(true);
        try {
          const wordData = await fetchWordDefinitions(searchTerm.trim());
          setResults(wordData);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        }
        setIsLoading(false);
      } else {
        setResults([]);
      }
    };

    const debounceTimer = setTimeout(searchWord, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="p-4 flex justify-end space-x-4 text-sm">
        <a href="#" className="hover:underline">
          Dictionary
        </a>
        <a href="#" className="hover:underline">
          Word of the day
        </a>
        <a href="#" className="hover:underline">
          Notebook
        </a>
        <a href="#" className="hover:underline">
          Thesaurus
        </a>
        <a href="#" className="hover:underline">
          Quiz
        </a>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <motion.div
          className="flex flex-col items-center w-full max-w-3xl"
          animate={{ y: results.length > 0 || isLoading ? -50 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.h1
            className="text-5xl font-bold mb-8 tracking-tighter"
            animate={{
              marginBottom: results.length > 0 ? "1rem" : "2rem",
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            MyDictionary
          </motion.h1>

          <div className="w-full">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for words (Ctrl+K)"
                className="w-full pr-4 py-8 rounded-xl shadow border border-[#e6e6e6] text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                ref={searchInputRef}
              />
              <Search
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={32}
              />
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="shimmer"
                  className="mt-4 space-y-4"
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
                      className={`p-4 rounded-lg  flex justify-between items-start ${
                        index === selectedIndex ? "bg-gray-100" : ""
                      }`}
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
