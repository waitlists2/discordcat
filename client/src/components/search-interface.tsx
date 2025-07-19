import { useState } from "react";
import { Search, Filter, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchFilters } from "@shared/schema";

interface SearchInterfaceProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export function SearchInterface({ onSearch, isLoading = false }: SearchInterfaceProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    content: "",
    author_id: "",
    channel_id: "",
    guild_id: "",
    sort: "desc",
    page: 1,
  });

  const handleSearch = () => {
    // Only search if there's actual content to search for
    if (!filters.content?.trim() && !filters.author_id?.trim() && !filters.channel_id?.trim() && !filters.guild_id?.trim()) {
      return;
    }
    
    // Reset to page 1 when starting new search
    const searchFilters = { ...filters, page: 1 };
    setFilters(searchFilters);
    onSearch(searchFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Main Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 flex items-center space-x-2 transition-colors duration-300">
        <div className="flex-1 flex items-center space-x-3 px-4">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search messages, users, channels, or servers..."
            value={filters.content || ""}
            onChange={(e) => setFilters({ ...filters, content: e.target.value })}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-0 text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
            autoComplete="off"
          />
        </div>
        
        {/* Filter Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Filters"
        >
          <Filter className="h-5 w-5" />
        </Button>
        
        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-medium"
        >
          <Zap className="h-4 w-4" />
          <span>{isLoading ? "Searching..." : "Search"}</span>
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-all duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author-id" className="block text-sm font-medium mb-2">
                Author ID
              </Label>
              <Input
                id="author-id"
                type="text"
                placeholder="User ID"
                value={filters.author_id || ""}
                onChange={(e) => setFilters({ ...filters, author_id: e.target.value })}
                className="bg-gray-50 dark:bg-gray-700 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="channel-id" className="block text-sm font-medium mb-2">
                Channel ID
              </Label>
              <Input
                id="channel-id"
                type="text"
                placeholder="Channel ID"
                value={filters.channel_id || ""}
                onChange={(e) => setFilters({ ...filters, channel_id: e.target.value })}
                className="bg-gray-50 dark:bg-gray-700 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="guild-id" className="block text-sm font-medium mb-2">
                Guild ID
              </Label>
              <Input
                id="guild-id"
                type="text"
                placeholder="Server ID"
                value={filters.guild_id || ""}
                onChange={(e) => setFilters({ ...filters, guild_id: e.target.value })}
                className="bg-gray-50 dark:bg-gray-700 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="sort-by" className="block text-sm font-medium mb-2">
                Sort By
              </Label>
              <Select
                value={filters.sort}
                onValueChange={(value: "asc" | "desc") => setFilters({ ...filters, sort: value })}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
