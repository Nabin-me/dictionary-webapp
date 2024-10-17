"use client";
import { MyDictionary } from "@/components/my-dictionary";

export default function DictionaryPage() {
  // Loaded from environment variables
  const API_KEY = process.env.NEXT_PUBLIC_DICTIONARY_API_KEY!;
  const API_URL = process.env.NEXT_PUBLIC_DICTIONARY_API_URL!;

  return (
    // Main dictionary component
    <MyDictionary apiKey={API_KEY} apiUrl={API_URL} className="p-4 w-full" />
  );
}
