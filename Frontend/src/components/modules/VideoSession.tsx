import React, { useState, useEffect } from "react";
import { Search, Youtube, Play, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface YouTubeVideo {
    id: {
        videoId: string;
    };
    snippet: {
        title: string;
        description: string;
        thumbnails: {
            high: {
                url: string;
            };
        };
        channelTitle: string;
        publishedAt: string;
    };
}

const API_KEY = "AIzaSyDbK33bp2xqIqdkPPw27Zq0kuQCQ7QgG1Y";

const VideoSession = () => {
    const [searchQuery, setSearchQuery] = useState("agriculture best practices");
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    const fetchVideos = async (query: string) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(
                    query
                )}&type=video&key=${API_KEY}`
            );
            const data = await response.json();
            if (data.items) {
                setVideos(data.items);
            } else if (data.error) {
                toast.error(`YouTube API Error: ${data.error.message}`);
            }
        } catch (error) {
            console.error("Error fetching videos:", error);
            toast.error("Failed to fetch videos. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos(searchQuery);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            fetchVideos(searchQuery);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Video Sessions</h1>
                    <p className="text-muted-foreground mt-1">
                        Learn with the best agriculture tutorials and expert sessions.
                    </p>
                </div>
                <div className="relative w-full md:w-96">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search agriculture videos..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </form>
                </div>
            </div>

            {selectedVideo ? (
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        className="mb-4"
                        onClick={() => setSelectedVideo(null)}
                    >
                        ← Back to Gallery
                    </Button>
                    <div className="aspect-video w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-border">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div className="max-w-5xl mx-auto mt-6">
                        <h2 className="text-2xl font-semibold mb-2">
                            {videos.find(v => v.id.videoId === selectedVideo)?.snippet.title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {videos.find(v => v.id.videoId === selectedVideo)?.snippet.description}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading && videos.length === 0 ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className="animate-pulse bg-muted h-64 border-none shadow-none"></Card>
                        ))
                    ) : (
                        videos.map((video) => (
                            <Card
                                key={video.id.videoId}
                                className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer bg-card/50 backdrop-blur-sm"
                                onClick={() => setSelectedVideo(video.id.videoId)}
                            >
                                <div className="relative aspect-video overflow-hidden">
                                    <img
                                        src={video.snippet.thumbnails.high.url}
                                        alt={video.snippet.title}
                                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                            <Play className="h-6 w-6 fill-current ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <CardHeader className="p-4 space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                                            YouTube
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                            {new Date(video.snippet.publishedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <CardTitle className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                        {video.snippet.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {video.snippet.channelTitle}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {!loading && videos.length === 0 && (
                <div className="text-center py-20">
                    <Youtube className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-medium">No videos found</h3>
                    <p className="text-muted-foreground">Try searching for something else like "organic farming".</p>
                </div>
            )}
        </div>
    );
};

export default VideoSession;
