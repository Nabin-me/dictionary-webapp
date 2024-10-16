"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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

  const fetchWordDefinition = async (word: string) => {
    try {
      const response = await fetch(`${API_URL}/${word}?key=${API_KEY}`);
      const data = await response.json();

      if (data[0] && typeof data[0] === "object") {
        return {
          word: data[0].meta?.id || word,
          definition: data[0].shortdef?.[0] || "No definition available",
          pronunciation: data[0].hwi?.prs?.[0]?.mw || undefined,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching definition:", error);
      return null;
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
          const wordData = await fetchWordDefinition(searchTerm.trim());
          if (wordData) {
            setResults([wordData]);
          } else {
            setResults([]);
          }
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
        <h1 className="text-5xl font-bold mb-8">MyDictionary</h1>

        <div className="w-full max-w-md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search (Ctrl+K)"
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              ref={searchInputRef}
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>

          <div className="mt-4 space-y-2">
            {isLoading ? (
              // Shimmer loading effect
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md flex justify-between items-start ${
                    index === selectedIndex ? "bg-gray-100" : "bg-white"
                  } ${
                    index === selectedIndex
                      ? "border-2 border-blue-500"
                      : "border"
                  }`}
                >
                  <div>
                    <h2 className="font-semibold">{result.word}</h2>
                    {result.pronunciation && (
                      <p className="text-sm text-gray-500 italic mb-1">
                        /{result.pronunciation}/
                      </p>
                    )}
                    <p className="text-sm text-gray-600">{result.definition}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
