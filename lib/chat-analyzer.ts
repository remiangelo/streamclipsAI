export interface ChatMessage {
  timestamp: number;
  username: string;
  message: string;
  emotes?: string[];
  isSubscriber?: boolean;
  isModerator?: boolean;
}

export interface HighlightMoment {
  timestamp: number;
  endTimestamp: number;
  messageCount: number;
  uniqueUsers: number;
  avgWordsPerMessage: number;
  sentimentScore: number;
  topEmotes: string[];
  confidenceScore: number;
  keywords: string[];
  reason: string;
}

interface TimeWindow {
  startTime: number;
  endTime: number;
  messages: ChatMessage[];
}

export class ChatAnalyzer {
  private readonly WINDOW_SIZE = 30; // 30 seconds
  private readonly MIN_MESSAGES_FOR_SPIKE = 10;
  private readonly SPIKE_THRESHOLD_MULTIPLIER = 2.5;
  private readonly MIN_CONFIDENCE_SCORE = 0.7;

  analyzeChatSpikes(messages: ChatMessage[]): HighlightMoment[] {
    if (messages.length === 0) return [];

    const timeWindows = this.createTimeWindows(messages, this.WINDOW_SIZE);
    const avgMessagesPerWindow = this.calculateAverageMessages(timeWindows);
    
    const highlights = timeWindows
      .map(window => this.analyzeWindow(window, avgMessagesPerWindow))
      .filter(moment => moment.confidenceScore >= this.MIN_CONFIDENCE_SCORE)
      .sort((a, b) => b.confidenceScore - a.confidenceScore);

    return this.mergeOverlappingHighlights(highlights);
  }

  private createTimeWindows(messages: ChatMessage[], windowSize: number): TimeWindow[] {
    if (messages.length === 0) return [];

    const windows: TimeWindow[] = [];
    const startTime = messages[0].timestamp;
    const endTime = messages[messages.length - 1].timestamp;

    for (let time = startTime; time < endTime; time += windowSize) {
      const windowMessages = messages.filter(
        msg => msg.timestamp >= time && msg.timestamp < time + windowSize
      );

      if (windowMessages.length > 0) {
        windows.push({
          startTime: time,
          endTime: time + windowSize,
          messages: windowMessages,
        });
      }
    }

    return windows;
  }

  private analyzeWindow(window: TimeWindow, avgMessagesPerWindow: number): HighlightMoment {
    const uniqueUsers = new Set(window.messages.map(m => m.username));
    const messageCount = window.messages.length;
    const avgWords = this.calculateAvgWords(window.messages);
    const sentiment = this.analyzeSentiment(window.messages);
    const topEmotes = this.extractTopEmotes(window.messages);
    const keywords = this.extractKeywords(window.messages);
    
    const confidenceScore = this.calculateConfidence(
      window,
      avgMessagesPerWindow,
      sentiment,
      topEmotes.length
    );

    const reason = this.determineHighlightReason(
      messageCount,
      avgMessagesPerWindow,
      sentiment,
      topEmotes.length
    );

    return {
      timestamp: window.startTime,
      endTimestamp: window.endTime,
      messageCount,
      uniqueUsers: uniqueUsers.size,
      avgWordsPerMessage: avgWords,
      sentimentScore: sentiment,
      topEmotes,
      confidenceScore,
      keywords,
      reason,
    };
  }

  private calculateAvgWords(messages: ChatMessage[]): number {
    if (messages.length === 0) return 0;
    
    const totalWords = messages.reduce((sum, msg) => {
      return sum + msg.message.split(/\s+/).length;
    }, 0);
    
    return totalWords / messages.length;
  }

  private analyzeSentiment(messages: ChatMessage[]): number {
    const positiveWords = ['pog', 'poggers', 'pogchamp', 'hype', 'lets go', 'letsgoo', 'nice', 'amazing', 'incredible', 'insane', 'crazy', 'god', 'goat', 'king', 'queen', 'clutch', 'sick', 'nasty', 'fire', 'lit', 'banger', 'ez', 'easy', 'clap', 'w', 'dub'];
    const negativeWords = ['rip', 'f', 'oof', 'yikes', 'bruh', 'pepehands', 'sadge', 'notlikethis', 'fail', 'throw', 'int', 'grief', 'bad', 'terrible', 'awful', 'trash', 'l', 'loss'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    messages.forEach(msg => {
      const lowerMessage = msg.message.toLowerCase();
      positiveWords.forEach(word => {
        if (lowerMessage.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (lowerMessage.includes(word)) negativeCount++;
      });
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 0;
    
    return (positiveCount - negativeCount) / total;
  }

  private extractTopEmotes(messages: ChatMessage[]): string[] {
    const emoteCount = new Map<string, number>();
    
    messages.forEach(msg => {
      if (msg.emotes) {
        msg.emotes.forEach(emote => {
          emoteCount.set(emote, (emoteCount.get(emote) || 0) + 1);
        });
      }
    });
    
    return Array.from(emoteCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emote]) => emote);
  }

  private extractKeywords(messages: ChatMessage[]): string[] {
    const wordFrequency = new Map<string, number>();
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);
    
    messages.forEach(msg => {
      const words = msg.message.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleaned = word.replace(/[^a-z0-9]/g, '');
        if (cleaned.length > 2 && !commonWords.has(cleaned)) {
          wordFrequency.set(cleaned, (wordFrequency.get(cleaned) || 0) + 1);
        }
      });
    });
    
    return Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private calculateConfidence(
    window: TimeWindow,
    avgMessagesPerWindow: number,
    sentimentScore: number,
    emoteCount: number
  ): number {
    const messageCount = window.messages.length;
    const uniqueUsers = new Set(window.messages.map(m => m.username)).size;
    
    // Message spike ratio (0-1)
    const spikeRatio = Math.min(messageCount / (avgMessagesPerWindow * this.SPIKE_THRESHOLD_MULTIPLIER), 1);
    
    // User engagement ratio (0-1)
    const userEngagement = Math.min(uniqueUsers / messageCount, 1);
    
    // Sentiment intensity (0-1)
    const sentimentIntensity = Math.abs(sentimentScore);
    
    // Emote usage (0-1)
    const emoteUsage = Math.min(emoteCount / 5, 1);
    
    // Weighted average
    const confidence = (
      spikeRatio * 0.4 +
      userEngagement * 0.2 +
      sentimentIntensity * 0.2 +
      emoteUsage * 0.2
    );
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  private calculateAverageMessages(windows: TimeWindow[]): number {
    if (windows.length === 0) return 0;
    
    const totalMessages = windows.reduce((sum, window) => sum + window.messages.length, 0);
    return totalMessages / windows.length;
  }

  private determineHighlightReason(
    messageCount: number,
    avgMessages: number,
    sentiment: number,
    emoteCount: number
  ): string {
    const reasons: string[] = [];
    
    if (messageCount > avgMessages * this.SPIKE_THRESHOLD_MULTIPLIER) {
      reasons.push('chat_spike');
    }
    
    if (sentiment > 0.5) {
      reasons.push('positive_reaction');
    } else if (sentiment < -0.5) {
      reasons.push('dramatic_moment');
    }
    
    if (emoteCount >= 3) {
      reasons.push('high_emote_usage');
    }
    
    return reasons.join('_') || 'general_activity';
  }

  private mergeOverlappingHighlights(highlights: HighlightMoment[]): HighlightMoment[] {
    if (highlights.length <= 1) return highlights;
    
    const merged: HighlightMoment[] = [];
    let current = highlights[0];
    
    for (let i = 1; i < highlights.length; i++) {
      const next = highlights[i];
      
      // If highlights are within 60 seconds of each other, merge them
      if (next.timestamp - current.endTimestamp <= 60) {
        current = {
          ...current,
          endTimestamp: next.endTimestamp,
          messageCount: current.messageCount + next.messageCount,
          uniqueUsers: Math.max(current.uniqueUsers, next.uniqueUsers),
          confidenceScore: Math.max(current.confidenceScore, next.confidenceScore),
          keywords: [...new Set([...current.keywords, ...next.keywords])].slice(0, 5),
        };
      } else {
        merged.push(current);
        current = next;
      }
    }
    
    merged.push(current);
    return merged;
  }
}