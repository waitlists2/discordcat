import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, MoreHorizontal } from "lucide-react";
import { SearchResults as SearchResultsType, SearchFilters, DiscordUser } from "@shared/schema";
import { format } from 'date-fns';

interface SearchResultsProps {
  filters: SearchFilters;
  onPageChange: (page: number) => void;
}

export function SearchResults({ filters, onPageChange }: SearchResultsProps) {
  const { data: results, isLoading, error } = useQuery<SearchResultsType>({
    queryKey: ["/api/search", JSON.stringify(filters)],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.content) params.append('content', filters.content);
      if (filters.author_id) params.append('author_id', filters.author_id);
      if (filters.channel_id) params.append('channel_id', filters.channel_id);
      if (filters.guild_id) params.append('guild_id', filters.guild_id);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', filters.page.toString());
      
      console.log("Making search request with params:", params.toString());
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Search failed');
      }
      return response.json();
    },
    enabled: Object.values(filters).some(value => value && value !== ""),
    onError: (error) => {
      console.error("Search query error:", error);
    },
    onSuccess: (data) => {
      console.log("Search query success:", {
        messageCount: data?.messages?.length,
        total: data?.total,
        page: data?.page
      });
    }
  });

  // Cache for user data
  const [userCache, setUserCache] = useState<Record<string, DiscordUser>>({});
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInputValue, setPageInputValue] = useState("");

  // Fetch user data for messages
  const { data: users } = useQuery<Record<string, DiscordUser>>({
    queryKey: ["/api/users", results?.messages.map(m => m.author_id).join(",")],
    queryFn: async () => {
      if (!results?.messages.length) return {};
      
      const uniqueUserIds = [...new Set(results.messages.map(m => m.author_id))];
      const uncachedUserIds = uniqueUserIds.filter(id => !userCache[id]);
      
      if (uncachedUserIds.length === 0) {
        return userCache;
      }
      
      const userPromises = uncachedUserIds.map(async (userId) => {
        try {
          const response = await fetch(`/api/user/${userId}`);
          if (response.ok) {
            const user = await response.json();
            return { [userId]: user };
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
        
        return { [userId]: { id: userId, username: `User ${userId.slice(-4)}`, avatar: null } };
      });

      const userResults = await Promise.all(userPromises);
      const newUsersMap = userResults.reduce((acc, userObj) => ({ ...acc, ...userObj }), {});
      const allUsers = { ...userCache, ...newUsersMap };
      setUserCache(allUsers);
      return allUsers;
    },
    enabled: !!results?.messages.length,
  });

  const formatTimestamp = (timestamp: string) => {
    // Format as 'April 4th, 2025, 3:45 PM'
    return format(new Date(timestamp), "MMMM do, yyyy, h:mm a");
  };

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInputValue);
    const totalPages = Math.ceil((results?.total || 0) / 50);
    if (pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setShowPageInput(false);
      setPageInputValue("");
    }
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePageInputSubmit();
    } else if (e.key === "Escape") {
      setShowPageInput(false);
      setPageInputValue("");
    }
  };

  const getPaginationRange = () => {
    if (!results) return [];
    const currentPage = results.page;
    const totalPages = Math.ceil(results.total / 50);
    const range = [];
    
    // Always show first page
    if (totalPages > 1) range.push(1);
    
    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    if (start > 2) range.push("...");
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) range.push(i);
    }
    
    if (end < totalPages - 1) range.push("...");
    
    // Always show last page
    if (totalPages > 1) range.push(totalPages);
    
    return range;
  };

  if (!Object.values(filters).some(value => value && value !== "")) {
    return (
      <div className="w-full max-w-4xl">
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-300">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Start searching to see results</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl">
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-300">
          <CardContent className="pt-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl">
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-300">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-red-500">Error loading search results. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results || results.messages.length === 0) {
    return (
      <div className="w-full max-w-4xl">
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-300">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No messages found matching your search.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-300">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Found {results.total.toLocaleString()} messages • Showing {((results.page - 1) * 50) + 1}-{Math.min(results.page * 50, results.total)} of {results.total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              Page {results.page} of {Math.ceil(results.total / 50)}
            </div>
          </div>
          
          <div className="space-y-4">
            {results.messages.map((message, index) => {
              const user = users?.[message.author_id];
              return (
                <div key={`${message.message_id}-${index}`} className="flex items-start space-x-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.username} />
                    <AvatarFallback>
                      {user?.username?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {user?.username || `User ${message.author_id.slice(-4)}`}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3 break-words leading-relaxed">
                      {message.content}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        Guild: {message.guild_id}
                      </span>
                      <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        Channel: {message.channel_id}
                      </span>
                      <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                        ID: {message.message_id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Pagination */}
      {(results.page > 1 || results.has_more) && (
        <div className="flex items-center justify-center space-x-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={results.page <= 1}
            className="flex items-center space-x-1"
          >
            <span>First</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(results.page - 1)}
            disabled={results.page <= 1}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </Button>
          
          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {getPaginationRange().map((page, index) => (
              <div key={index}>
                {page === "..." ? (
                  showPageInput ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        value={pageInputValue}
                        onChange={(e) => setPageInputValue(e.target.value)}
                        onKeyPress={handlePageInputKeyPress}
                        onBlur={() => setShowPageInput(false)}
                        className="w-16 h-8 text-xs text-center"
                        placeholder="Page"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPageInput(true)}
                      className="px-2 py-1 h-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  )
                ) : (
                  <Button
                    variant={page === results.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className="px-3 py-1 h-8 min-w-[2rem]"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(results.page + 1)}
            disabled={!results.has_more}
            className="flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.ceil(results.total / 50))}
            disabled={!results.has_more}
            className="flex items-center space-x-1"
          >
            <span>Last</span>
          </Button>
        </div>
      )}
    </div>
  );
}
