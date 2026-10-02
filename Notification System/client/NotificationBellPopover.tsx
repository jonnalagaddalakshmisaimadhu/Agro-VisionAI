import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CloudRain,
  TrendingUp,
  AlertTriangle,
  Info,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  X,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InAppNotificationItem,
  getStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications
} from "./notificationStore";

export const NotificationBellPopover: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "weather" | "mandi" | "system">("all");
  const [notifications, setNotifications] = useState<InAppNotificationItem[]>([]);

  // Load from store and listen for real-time window events
  const loadNotifications = () => {
    setNotifications(getStoredNotifications());
  };

  useEffect(() => {
    loadNotifications();

    const handleCustomEvent = () => {
      loadNotifications();
    };

    window.addEventListener("farmiq-notification-event", handleCustomEvent);
    window.addEventListener("storage", handleCustomEvent);

    return () => {
      window.removeEventListener("farmiq-notification-event", handleCustomEvent);
      window.removeEventListener("storage", handleCustomEvent);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "weather") return n.category === "weather";
    if (filter === "mandi") return n.category === "mandi";
    if (filter === "system") return n.category === "system" || n.category === "personal";
    return true;
  });

  const getCategoryIcon = (category: string, priority?: string) => {
    if (priority === "urgent") {
      return <ShieldAlert className="h-4 w-4 text-red-500" />;
    }
    switch (category) {
      case "weather":
        return <CloudRain className="h-4 w-4 text-blue-500" />;
      case "mandi":
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case "personal":
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case "system":
      default:
        return <Info className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  const handleItemClick = (item: InAppNotificationItem) => {
    markNotificationRead(item.id);
    loadNotifications();
    if (item.action_url) {
      setOpen(false);
      navigate(item.action_url);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground rounded-full transition-colors"
          aria-label="FarmIQ Alerts & Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[92vw] sm:w-[400px] p-0 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden z-50"
      >
        {/* Header Bar */}
        <div className="p-3.5 px-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Farm Alerts & Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 font-bold">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  markAllNotificationsRead();
                  loadNotifications();
                }}
                className="h-7 px-2 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="text-[11px] hidden sm:inline">Mark read</span>
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearAllNotifications();
                  loadNotifications();
                }}
                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg"
                title="Clear all notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-3 pt-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
            <TabsList className="grid grid-cols-4 h-8 bg-slate-100/80 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
              <TabsTrigger value="all" className="rounded-md py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 font-medium">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="weather" className="rounded-md py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 font-medium">
                Weather
              </TabsTrigger>
              <TabsTrigger value="mandi" className="rounded-md py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 font-medium">
                Mandi
              </TabsTrigger>
              <TabsTrigger value="system" className="rounded-md py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 font-medium">
                System
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications Scroll Area */}
        <ScrollArea className="h-[340px] max-h-[60vh] divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No notifications in this tab
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Turn on Weather Alerts or Mandi Price Ticker to receive live updates here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group relative p-3.5 transition-all cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/60 flex items-start gap-3 ${
                  !item.is_read ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                }`}
              >
                {/* Category Icon */}
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 mt-0.5 shrink-0 group-hover:scale-105 transition-transform">
                  {getCategoryIcon(item.category, item.priority)}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <p className={`text-xs font-semibold truncate ${!item.is_read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTimestamp(item.created_at)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>

                  {item.action_url && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
                      <span>View details</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Unread dot / Dismiss Button */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  {!item.is_read && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                      loadNotifications();
                    }}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 rounded-md transition-opacity"
                    title="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        {/* Footer info */}
        <div className="p-2.5 px-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Switches in Weather & Settings trigger live alerts</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setOpen(false);
              navigate("/settings");
            }}
            className="h-auto p-0 text-[11px] text-emerald-600 font-semibold"
          >
            Settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
