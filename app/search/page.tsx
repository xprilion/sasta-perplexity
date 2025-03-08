"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Image as ImageX, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { geminiApi } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  document: string;
  metadata: {
    content_type: string;
    title: string;
    description: string;
    url: string;
  };
}

const searchQdrant = async (query: string, content_type: "text" | "image") => {
  const result = await fetch("http://localhost:8000/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      content_type,
    }),
  });
  return result.json();
};

const rephraseQuery = async (query: string): Promise<string[]> => {
  const prompt = `Generate 4 different enhanced versions of this search query, each more detailed and comprehensive than the original: "${query}". Return exactly 4 variations, separated by newlines.`;
  const response = await geminiApi(prompt);
  return response.split("\n").filter((q: string) => q.trim());
};

const generateSummary = async (results: SearchResult[]): Promise<string> => {
  const resultsText = results
    .map((r) => `${r.metadata.title}: ${r.metadata.description}`)
    .join("\n");
  const prompt = `Summarize these search results in 2-3 sentences:\n${resultsText}`;
  return await geminiApi(prompt);
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "web";
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedQueries, setEnhancedQueries] = useState<string[]>([]);
  const [selectedQuery, setSelectedQuery] = useState("");
  const [summary, setSummary] = useState("");
  const [searchStep, setSearchStep] = useState(0);

  useEffect(() => {
    const initializeSearch = async () => {
      if (query) {
        setIsLoading(true);
        try {
          // Step 1: Generate enhanced queries
          setSearchStep(1);
          const enhanced = await rephraseQuery(query);
          setEnhancedQueries(enhanced);
        } catch (error) {
          console.error("Error during search process:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    initializeSearch();
  }, [query]);

  const handleEnhancedQuerySelect = async (selectedEnhancedQuery: string) => {
    setSelectedQuery(selectedEnhancedQuery);
    setIsLoading(true);
    setSearchStep(2);

    try {
      // Step 2: Search with selected query
      const results = await searchQdrant(
        selectedEnhancedQuery,
        type === "web" ? "text" : "image"
      );
      const filteredResults = results.filter((result: SearchResult) =>
        type === "web"
          ? result.metadata.content_type === "text"
          : result.metadata.content_type === "image"
      );
      setSearchResults(filteredResults);
      setSearchStep(3);

      // Step 3: Generate summary
      if (filteredResults.length > 0) {
        const resultSummary = await generateSummary(filteredResults);
        setSummary(resultSummary);
      }
      setSearchStep(4);
    } catch (error) {
      console.error("Error during search process:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    if (!newQuery.trim()) return;
    setSearchStep(0);
    setSelectedQuery("");
    setSummary("");
    setEnhancedQueries([]);
    router.push(`/search?q=${encodeURIComponent(newQuery)}&type=${type}`);
  };

  const handleTabChange = (value: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}&type=${value}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-primary hover:opacity-80">
              <ArrowLeft className="w-6 h-6" />
            </Link>

            <div className="flex items-center gap-2">
              <Image
                src="/logo_wide_transparent.png"
                alt="Logo"
                width={100}
                height={100}
              />
            </div>

            <div className="flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSearch(searchQuery)
                }
                className="max-w-xl"
                placeholder="Search anything..."
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue={type} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Web
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageX className="w-4 h-4" />
              Images
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center mt-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Step {searchStep}:{" "}
                {searchStep === 1
                  ? "Generating enhanced queries"
                  : searchStep === 2
                  ? "Searching"
                  : searchStep === 3
                  ? "Processing results"
                  : "Generating summary"}
              </p>
            </div>
          ) : (
            <div className="flex gap-6 mt-6">
              <div className="flex-1">
                {enhancedQueries.length > 0 && !selectedQuery && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-4">
                      Choose an enhanced query:
                    </h3>
                    <div className="space-y-2">
                      {enhancedQueries.map((eq, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full text-left justify-start"
                          onClick={() => handleEnhancedQuerySelect(eq)}
                        >
                          {eq}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuery && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold">Selected Query:</h3>
                    <p>{selectedQuery}</p>
                  </div>
                )}

                <TabsContent value="web">
                  <div className="space-y-6">
                    {searchResults.map((result) => (
                      <div key={result.id} className="space-y-1">
                        <a
                          href={result.metadata.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          {result.metadata.url}
                        </a>
                        <h2 className="text-xl font-semibold text-primary hover:underline">
                          <a
                            href={result.metadata.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {result.metadata.title}
                          </a>
                        </h2>
                        <p className="text-muted-foreground">
                          {result.metadata.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="images">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {searchResults.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square overflow-hidden rounded-lg"
                      >
                        <img
                          src={image.metadata.url}
                          alt={image.metadata.title}
                          className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-white text-sm truncate">
                            {image.metadata.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>

              {summary && (
                <div className="max-w-[400px] shrink-0">
                  <div className="sticky top-6 p-4 bg-muted rounded-lg max-w-[400px]">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">{summary}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Tabs>
      </main>
    </div>
  );
}
