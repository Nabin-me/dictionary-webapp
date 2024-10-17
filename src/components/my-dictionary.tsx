import { useState, useEffect, useRef, KeyboardEvent, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, AudioLines, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { customWords } from "../lib/custom-words";

// interfaces for dictionary entries and component props
export interface DictionaryEntry {
  word: string;
  definition: string;
  pronunciation?: string;
  avatarUrl?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  meanings?: {
    definition: string;
    examples?: string[];
  }[];
}

interface MyDictionaryProps {
  apiKey: string;
  apiUrl: string;
  title?: string;
  className?: string;
}

export function MyDictionary({
  apiKey,
  apiUrl,
  className = "",
}: MyDictionaryProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(
    null
  );

  // References
  const searchInputRef = useRef<HTMLInputElement>(null);
  const animationTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get custom word definitions
  const getCustomWord = (word: string): DictionaryEntry | null => {
    const lowercaseWord = word.toLowerCase();
    return customWords[lowercaseWord] || null;
  };

  // Handle keyboard navigation in search results
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

  // Fetch word definitions from API or custom words
  const fetchWordDefinitions = async (
    word: string
  ): Promise<DictionaryEntry[]> => {
    const customWord = getCustomWord(word);
    if (customWord) {
      return [customWord];
    }

    // Fetch from Dictionary API
    // The api url and key are passed as props from the parent component
    try {
      const response = await fetch(`${apiUrl}/${word}?key=${apiKey}`);
      const data = await response.json();

      if (!data.length || !data[0].shortdef || !data[0].shortdef.length) {
        return [
          {
            word: word,
            definition: "No definition available",
            pronunciation: undefined,
          },
        ];
      }

      // Process the first entry with enhanced information
      const entry = data[0];
      const audioBaseUrl = "https://media.merriam-webster.com/soundc11";
      const audioFilename = entry.hwi?.prs?.[0]?.sound?.audio;
      const audioUrl = audioFilename
        ? `${audioBaseUrl}/${audioFilename[0]}/${audioFilename}.wav`
        : undefined;

      // Extract meanings and additional information

      const meanings = entry.shortdef.map((def: string, index: number) => {
        const sseq = entry.def?.[0]?.sseq?.[index]?.[0]?.[1];
        const exampleData = sseq?.dt?.find((dt: any) => dt[0] === "vis");
        const examples =
          exampleData?.[1]?.map((ex: any) => ex.t.replace(/{[^}]+}/g, "")) ||
          [];

        return {
          definition: def,
          examples,
        };
      });

      return [
        {
          word: entry.meta?.id.split(":")[0] || word,
          definition: entry.shortdef[0],
          pronunciation: entry.hwi?.prs?.[0]?.mw,
          audioUrl,
          partOfSpeech: entry.fl,
          meanings,
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

  // Play audio for pronunciation
  const playAudio = useCallback((audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
    setPlayingAudio(audioUrl);
    audio.onended = () => setPlayingAudio(null);
  }, []);

  // DetailView component for displaying full word information
  const DetailView = useCallback(
    ({ entry }: { entry: DictionaryEntry }) => {
      const [localPlayingAudio, setLocalPlayingAudio] = useState<string | null>(
        null
      );

      const handlePlayAudio = useCallback(
        (audioUrl: string) => {
          playAudio(audioUrl);
          setLocalPlayingAudio(audioUrl);
          setTimeout(() => setLocalPlayingAudio(null), 1000);
        },
        [playAudio]
      );

      if (
        entry.word.toLowerCase() === "nabin dahal" ||
        entry.word.toLowerCase() === "nabin" ||
        entry.word.toLowerCase() === "aaditya pradhan" ||
        entry.word.toLowerCase() === "aaditya"
      ) {
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl"
            layout
          >
            <button
              onClick={() => setSelectedEntry(null)}
              className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2" /> Back to search
            </button>

            <div
              className="relative before:absolute before:top-0 before:left-0 before:w-full
     before:h-full before:content-[''] before:opacity-[0.05] before:z-10 before:pointer-events-none
     before:bg-[url('/images/noise.gif')]"
            >
              <Card className="bg-gradient-to-r from-[#1b0822] to-[#061020] text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-5xl font-bold drop-shadow-[0_10px_30px_rgba(255,255,255,1)]">
                        {entry.word}
                      </CardTitle>
                      <p className="text-xl mt-2">/{entry.pronunciation}/</p>
                    </div>
                    <Image
                      src={entry.avatarUrl || "/images/nabin.png"}
                      alt={`${entry.word} avatar`}
                      width={100}
                      height={100}
                      className="rounded-full border-2 border-white"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-2xl font-semibold">{entry.definition}</p>
                    {entry.meanings?.map((meaning, index) => (
                      <div key={index} className="bg-white/10 p-4 rounded-lg">
                        <p className="text-xl mb-2">
                          <span className="font-medium">
                            {index + 1}. {meaning.definition}
                          </span>
                        </p>
                        {meaning.examples && meaning.examples.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-lg font-medium mb-1">
                              Examples:
                            </h4>
                            <ul className="list-disc list-inside">
                              {meaning.examples.map((example, i) => (
                                <li key={i} className="text-sm">
                                  {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );
      }

      // Existing DetailView code for other words
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-3xl"
          layout
        >
          <button
            onClick={() => setSelectedEntry(null)}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="mr-2" /> Back to search
          </button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-4xl font-bold text-[#3A91CE]">
                    {entry.word}
                  </CardTitle>
                  {entry.pronunciation && (
                    <p className="text-lg text-gray-500 flex items-center">
                      /{entry.pronunciation}/
                      {entry.audioUrl && (
                        <button
                          onClick={() => handlePlayAudio(entry.audioUrl!)}
                          className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <AudioLines
                            size={20}
                            className={
                              localPlayingAudio === entry.audioUrl
                                ? "text-blue-500"
                                : ""
                            }
                          />
                        </button>
                      )}
                    </p>
                  )}
                  {entry.partOfSpeech && (
                    <Badge variant="secondary" className="mt-2">
                      {entry.partOfSpeech}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {entry.meanings?.map((meaning, index) => (
                  <div
                    key={index}
                    className={`${
                      index !== entry.meanings!.length - 1
                        ? "border-b border-gray-200"
                        : ""
                    } pb-4`}
                  >
                    <p className="text-lg mb-2">
                      <span className="font-medium text-gray-700">
                        {index + 1}. {meaning.definition}
                      </span>
                    </p>
                    {(meaning.examples?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">
                          Examples:
                        </h4>
                        <ul className="list-disc list-inside text-gray-600 text-sm">
                          {meaning.examples?.map((example, i) => {
                            // Split the example text and make the word bold
                            const parts = example.split(
                              new RegExp(`(${entry.word})`, "gi")
                            );
                            return (
                              <li key={i} className="ml-4">
                                {parts.map((part, index) =>
                                  part.toLowerCase() ===
                                  entry.word.toLowerCase() ? (
                                    <strong
                                      key={index}
                                      className="text-blue-500"
                                    >
                                      {part}
                                    </strong>
                                  ) : (
                                    part
                                  )
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    },
    [playAudio, setSelectedEntry]
  );

  // Handle click on a dictionary entry card
  const handleCardClick = (entry: DictionaryEntry) => {
    // Only set the selected entry if a definition is available
    if (
      entry.definition !== "No definition available" &&
      entry.definition !== "Error fetching definition"
    ) {
      setSelectedEntry(entry);
    }
  };

  // Effect for global keyboard shortcut (Ctrl+K)
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

  // Effect for searching words with debounce
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

  // Main component render
  return (
    <div className={`bg-white text-gray-900 flex flex-col ${className}`}>
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {selectedEntry ? (
            <DetailView entry={selectedEntry} />
          ) : (
            <motion.div
              className="flex flex-col items-center w-full max-w-3xl"
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* Logo and title */}
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
              <h2 className="text-xl mb-8 max-w-lg text-center text-gray-500">
                Get deliciously defined!
              </h2>

              {/* Search input and results */}
              <div className="w-full">
                {/* Search input */}
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

                {/* Search results or loading state */}
                <AnimatePresence mode="wait">
                  {isLoading || isAnimating ? (
                    // Loading shimmer effect
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
                    // Search results
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
                          className={`p-4 rounded-lg flex justify-between items-start ${
                            result.definition !== "No definition available" &&
                            result.definition !== "Error fetching definition"
                              ? "cursor-pointer hover:bg-gray-100"
                              : "cursor-not-allowed opacity-50"
                          } transition-colors ${
                            index === selectedIndex ? "bg-gray-100" : ""
                          }`}
                          onClick={() => handleCardClick(result)}
                        >
                          <div>
                            <h2 className="font-semibold text-lg">
                              {result.word}
                            </h2>

                            <div className="flex items-center gap-2 mb-2">
                              {result.pronunciation && (
                                <p className="text-sm text-gray-500">
                                  /{result.pronunciation}/
                                </p>
                              )}
                              {result.audioUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playAudio(result.audioUrl!);
                                  }}
                                  className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  <AudioLines
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
                            <p className="text-sm text-gray-600">
                              {result.definition}
                            </p>
                          </div>
                          {result.definition !== "No definition available" &&
                            result.definition !==
                              "Error fetching definition" && (
                              <div className="text-gray-400 text-xl">→</div>
                            )}
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
