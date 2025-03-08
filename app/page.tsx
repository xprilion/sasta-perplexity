"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { geminiApi } from "@/lib/firebase";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // const res = await geminiApi("What is the capital of the moon?");
  // console.log(res);

  const handleSearch = (type: "web" | "images") => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch("web");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 text-4xl font-bold">
          <Image
            src="/logo_wide_transparent.png"
            alt="Logo"
            width={500}
            height={100}
          />
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search anything..."
              className="w-full h-12 pl-4 pr-10 text-lg rounded-full border-2 border-gray-200 focus:border-primary"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => handleSearch("web")}
            >
              Web Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => handleSearch("images")}
            >
              Image Search
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
