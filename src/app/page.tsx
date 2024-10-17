// app/page.tsx
"use client";

import { MyDictionary } from "@/components/my-dictionary";
import type { DictionaryEntry } from "@/components/my-dictionary";

export default function DictionaryPage() {
  // You would typically load these from environment variables
  const API_KEY = process.env.DICTIONARY_API_KEY!;
  const API_URL = process.env.DICTIONARY_API_URL!;

  const handleWordSelect = (entry: DictionaryEntry) => {
    console.log("Selected word:", entry);
  };

  return (
    <div className=" bg-gray-50">
      <MyDictionary
        apiKey={API_KEY}
        apiUrl={API_URL}
        className="p-4"
        onWordSelect={handleWordSelect}
      />
    </div>
  );
}
