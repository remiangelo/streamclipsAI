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
  private readonly MIN_MESSAGES_FOR_SPIKE = 5;
  private readonly SPIKE_THRESHOLD_MULTIPLIER = 1.5;
  private readonly MIN_CONFIDENCE_SCORE = 0.4;

  // Add the method expected by tests
  analyzeChatMessages(messages: ChatMessage[], vodDuration: number): any[] {
    const highlights = this.analyzeChatSpikes(messages);
    
    // Map to the format expected by tests
    return highlights.map(h => ({
      startTime: h.timestamp,
      endTime: h.endTimestamp,
      confidence: h.confidenceScore,
      reason: h.reason,
      keywords: h.keywords,
      sentiment: h.sentimentScore
    }));
  }

  analyzeChatSpikes(messages: ChatMessage[]): HighlightMoment[] {
    if (messages.length === 0) return [];

    const timeWindows = this.createTimeWindows(messages, this.WINDOW_SIZE);
    const avgMessagesPerWindow = this.calculateAverageMessages(timeWindows);
    
    const highlights = timeWindows
      .map(window => this.analyzeWindow(window, avgMessagesPerWindow))
      .filter(moment => {
        // Only include windows with significant activity
        return moment.messageCount >= this.MIN_MESSAGES_FOR_SPIKE && 
               moment.confidenceScore >= this.MIN_CONFIDENCE_SCORE;
      })
      .sort((a, b) => b.confidenceScore - a.confidenceScore);

    return this.mergeOverlappingHighlights(highlights);
  }

  private createTimeWindows(messages: ChatMessage[], windowSize: number): TimeWindow[] {
    if (messages.length === 0) return [];

    const windows: TimeWindow[] = [];
    const startTime = messages[0].timestamp;
    const endTime = messages[messages.length - 1].timestamp;

    // Convert windowSize from seconds to milliseconds
    const windowSizeMs = windowSize * 1000;

    for (let time = startTime; time < endTime; time += windowSizeMs) {
      const windowMessages = messages.filter(
        msg => msg.timestamp >= time && msg.timestamp < time + windowSizeMs
      );

      if (windowMessages.length > 0) {
        windows.push({
          startTime: time,
          endTime: time + windowSizeMs,
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
    const commonEmotes = ['PogChamp', 'KEKW', 'LUL', 'OMEGALUL', 'Kappa', 'POGGERS', 'Pog', 'EZ', 'Clap', 'monkaS', 'pepeLaugh', 'LULW'];
    
    messages.forEach(msg => {
      // Check for emotes in message content
      commonEmotes.forEach(emote => {
        if (msg.message.includes(emote)) {
          emoteCount.set(emote, (emoteCount.get(emote) || 0) + 1);
        }
      });
      
      // Also check if emotes are provided
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
    
    // Base confidence from message count
    let confidence = 0;
    
    // If we have enough messages for a spike
    if (messageCount >= this.MIN_MESSAGES_FOR_SPIKE) {
      confidence = 0.5; // Base confidence for having minimum messages
      
      // Message spike ratio (0-0.3)
      const spikeRatio = Math.min(messageCount / (avgMessagesPerWindow * this.SPIKE_THRESHOLD_MULTIPLIER), 1);
      confidence += spikeRatio * 0.3;
      
      // User engagement ratio (0-0.1)
      const userEngagement = Math.min(uniqueUsers / messageCount, 1);
      confidence += userEngagement * 0.1;
      
      // Emote usage (0-0.1)
      const emoteUsage = Math.min(emoteCount / 3, 1);
      confidence += emoteUsage * 0.1;
    }
    
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
    
    if (messageCount >= this.MIN_MESSAGES_FOR_SPIKE) {
      reasons.push('activity spike');
    }
    
    if (sentiment > 0.5) {
      reasons.push('positive reaction');
    } else if (sentiment < -0.5) {
      reasons.push('dramatic moment');
    }
    
    if (emoteCount >= 3) {
      reasons.push('high emote usage');
    }
    
    return reasons.join(', ') || 'general activity';
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