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
  peakActivity: number; // Peak messages per second in the window
  activityPattern: 'spike' | 'sustained' | 'gradual';
}

interface TimeWindow {
  startTime: number;
  endTime: number;
  messages: ChatMessage[];
}

interface EmoteAnalysis {
  totalEmoteCount: number;
  uniqueEmotes: string[];
  emoteCategories: {
    hype: number;
    laugh: number;
    surprise: number;
    celebration: number;
  };
  emoteDensity: number; // Emotes per message
  isBurst: boolean;
}

// Popular Twitch emotes categorized by type
const HYPE_EMOTES = [
  'PogChamp', 'Pog', 'POGGERS', 'PogU', 'POGGIES', 'HYPERS', 
  'EZ', 'Clap', 'LETSGOOOO', '5Head', 'GIGACHAD', 'BASED'
];

const LAUGH_EMOTES = [
  'KEKW', 'LUL', 'LULW', 'OMEGALUL', 'LMAO', 'pepeLaugh', 
  'KEKL', 'EleGiggle', 'forsenKEK', 'ICANT'
];

const SURPRISE_EMOTES = [
  'monkaS', 'monkaW', 'WutFace', 'D:', 'gachiHYPER', 
  'WAYTOODANK', 'WeirdChamp', 'PauseChamp', 'DansGame'
];

const CELEBRATION_EMOTES = [
  'PepoDance', 'pepeD', 'dancePls', 'PartyParrot', 'pepeJAM',
  'catJAM', 'vibeCheck', 'ratJAM', 'RAVE'
];

const ALL_TRACKED_EMOTES = [...HYPE_EMOTES, ...LAUGH_EMOTES, ...SURPRISE_EMOTES, ...CELEBRATION_EMOTES];

export class ChatAnalyzer {
  private readonly WINDOW_SIZE = 30; // 30 seconds
  private readonly SLIDING_STEP = 5; // Slide window by 5 seconds
  private readonly MIN_MESSAGES_FOR_SPIKE = 5;
  private readonly SPIKE_THRESHOLD_MULTIPLIER = 2.0; // Increased for better spike detection
  private readonly MIN_CONFIDENCE_SCORE = 0.4;
  private readonly BASELINE_WINDOW_SIZE = 60; // 60 seconds for baseline calculation
  private readonly MERGE_THRESHOLD = 45; // Merge highlights within 45 seconds
  private readonly EMOTE_BURST_THRESHOLD = 0.4; // 40% of messages need emotes for burst

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

    // Create sliding windows for better detection
    const timeWindows = this.createSlidingWindows(messages, this.WINDOW_SIZE, this.SLIDING_STEP);
    
    // Calculate baseline activity for better spike detection
    const baselineActivity = this.calculateBaselineActivity(messages);
    
    const highlights = timeWindows
      .map(window => this.analyzeWindow(window, baselineActivity))
      .filter(moment => {
        // Filter based on spike detection and confidence
        return moment.messageCount >= this.MIN_MESSAGES_FOR_SPIKE && 
               moment.confidenceScore >= this.MIN_CONFIDENCE_SCORE &&
               moment.peakActivity > baselineActivity.avgMessagesPerSecond * this.SPIKE_THRESHOLD_MULTIPLIER;
      })
      .sort((a, b) => b.confidenceScore - a.confidenceScore);

    return this.mergeOverlappingHighlights(highlights);
  }

  private createSlidingWindows(messages: ChatMessage[], windowSize: number, stepSize: number): TimeWindow[] {
    if (messages.length === 0) return [];

    const windows: TimeWindow[] = [];
    const startTime = messages[0].timestamp;
    const endTime = messages[messages.length - 1].timestamp;

    // Convert to milliseconds
    const windowSizeMs = windowSize * 1000;
    const stepSizeMs = stepSize * 1000;

    // Use sliding windows for better detection
    for (let time = startTime; time <= endTime - windowSizeMs; time += stepSizeMs) {
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

  private calculateBaselineActivity(messages: ChatMessage[]): { avgMessagesPerSecond: number; stdDeviation: number } {
    if (messages.length === 0) return { avgMessagesPerSecond: 0, stdDeviation: 0 };

    const windows = this.createSlidingWindows(messages, this.BASELINE_WINDOW_SIZE, this.BASELINE_WINDOW_SIZE / 2);
    const messagesPerSecond = windows.map(w => w.messages.length / this.BASELINE_WINDOW_SIZE);
    
    const avg = messagesPerSecond.reduce((a, b) => a + b, 0) / messagesPerSecond.length || 0;
    const variance = messagesPerSecond.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / messagesPerSecond.length || 0;
    const stdDev = Math.sqrt(variance);

    return { avgMessagesPerSecond: avg, stdDeviation: stdDev };
  }

  private analyzeWindow(window: TimeWindow, baselineActivity: { avgMessagesPerSecond: number; stdDeviation: number }): HighlightMoment {
    const uniqueUsers = new Set(window.messages.map(m => m.username));
    const messageCount = window.messages.length;
    const avgWords = this.calculateAvgWords(window.messages);
    const sentiment = this.analyzeSentiment(window.messages);
    const topEmotes = this.extractTopEmotes(window.messages);
    const keywords = this.extractKeywords(window.messages);
    
    const peakActivity = this.calculatePeakActivity(window.messages);
    const activityPattern = this.detectActivityPattern(window.messages);
    const emoteAnalysis = this.analyzeEmotes(window.messages);
    
    const confidenceScore = this.calculateConfidence(
      window,
      baselineActivity,
      sentiment,
      emoteAnalysis,
      peakActivity,
      activityPattern
    );

    const reason = this.determineHighlightReason(
      messageCount,
      baselineActivity.avgMessagesPerSecond,
      sentiment,
      emoteAnalysis,
      peakActivity,
      activityPattern
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
      peakActivity,
      activityPattern,
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
    const emoteAnalysis = this.analyzeEmotes(messages);
    
    // Get emote counts
    const emoteCount = new Map<string, number>();
    messages.forEach(msg => {
      // Check for emotes in message content
      ALL_TRACKED_EMOTES.forEach(emote => {
        // Count occurrences in message (case sensitive for emotes)
        const regex = new RegExp(`\\b${emote}\\b`, 'g');
        const matches = msg.message.match(regex);
        if (matches) {
          emoteCount.set(emote, (emoteCount.get(emote) || 0) + matches.length);
        }
      });
      
      // Also check if emotes are provided in metadata
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

  private analyzeEmotes(messages: ChatMessage[]): EmoteAnalysis {
    let totalEmoteCount = 0;
    const uniqueEmotes = new Set<string>();
    const emoteCategories = {
      hype: 0,
      laugh: 0,
      surprise: 0,
      celebration: 0
    };
    
    messages.forEach(msg => {
      // Check tracked emotes
      ALL_TRACKED_EMOTES.forEach(emote => {
        const regex = new RegExp(`\\b${emote}\\b`, 'g');
        const matches = msg.message.match(regex);
        if (matches) {
          totalEmoteCount += matches.length;
          uniqueEmotes.add(emote);
          
          // Categorize emotes
          if (HYPE_EMOTES.includes(emote)) {
            emoteCategories.hype += matches.length;
          } else if (LAUGH_EMOTES.includes(emote)) {
            emoteCategories.laugh += matches.length;
          } else if (SURPRISE_EMOTES.includes(emote)) {
            emoteCategories.surprise += matches.length;
          } else if (CELEBRATION_EMOTES.includes(emote)) {
            emoteCategories.celebration += matches.length;
          }
        }
      });
      
      // Count emotes from metadata
      if (msg.emotes) {
        msg.emotes.forEach(emote => {
          totalEmoteCount++;
          uniqueEmotes.add(emote);
        });
      }
    });
    
    const emoteDensity = messages.length > 0 ? totalEmoteCount / messages.length : 0;
    const messagesWithEmotes = messages.filter(msg => {
      const hasTrackedEmote = ALL_TRACKED_EMOTES.some(emote => 
        new RegExp(`\\b${emote}\\b`).test(msg.message)
      );
      return hasTrackedEmote || (msg.emotes && msg.emotes.length > 0);
    }).length;
    
    const isBurst = messages.length > 0 && 
                   (messagesWithEmotes / messages.length) >= this.EMOTE_BURST_THRESHOLD;
    
    return {
      totalEmoteCount,
      uniqueEmotes: Array.from(uniqueEmotes),
      emoteCategories,
      emoteDensity,
      isBurst
    };
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

  private calculatePeakActivity(messages: ChatMessage[]): number {
    if (messages.length === 0) return 0;
    
    // Calculate messages per second in 1-second buckets
    const buckets = new Map<number, number>();
    messages.forEach(msg => {
      const second = Math.floor(msg.timestamp / 1000);
      buckets.set(second, (buckets.get(second) || 0) + 1);
    });
    
    return Math.max(...buckets.values());
  }

  private detectActivityPattern(messages: ChatMessage[]): 'spike' | 'sustained' | 'gradual' {
    if (messages.length < 3) return 'spike';
    
    const windowDuration = (messages[messages.length - 1].timestamp - messages[0].timestamp) / 1000;
    const thirds = windowDuration / 3;
    
    const firstThird = messages.filter(m => m.timestamp < messages[0].timestamp + thirds * 1000).length;
    const middleThird = messages.filter(m => m.timestamp >= messages[0].timestamp + thirds * 1000 && m.timestamp < messages[0].timestamp + thirds * 2000).length;
    const lastThird = messages.filter(m => m.timestamp >= messages[0].timestamp + thirds * 2000).length;
    
    const max = Math.max(firstThird, middleThird, lastThird);
    const avg = (firstThird + middleThird + lastThird) / 3;
    
    if (max > avg * 2) return 'spike';
    if (Math.abs(firstThird - lastThird) < avg * 0.3) return 'sustained';
    return 'gradual';
  }

  private calculateConfidence(
    window: TimeWindow,
    baselineActivity: { avgMessagesPerSecond: number; stdDeviation: number },
    sentimentScore: number,
    emoteAnalysis: EmoteAnalysis,
    peakActivity: number,
    activityPattern: 'spike' | 'sustained' | 'gradual'
  ): number {
    const messageCount = window.messages.length;
    const uniqueUsers = new Set(window.messages.map(m => m.username)).size;
    const windowDurationSeconds = (window.endTime - window.startTime) / 1000;
    const avgMessagesPerSecond = messageCount / windowDurationSeconds;
    
    let confidence = 0;
    
    // Activity spike detection (0-0.4)
    if (peakActivity > baselineActivity.avgMessagesPerSecond * this.SPIKE_THRESHOLD_MULTIPLIER) {
      const spikeIntensity = Math.min((peakActivity - baselineActivity.avgMessagesPerSecond) / (baselineActivity.stdDeviation + 1), 3);
      confidence += spikeIntensity * 0.13;
    }
    
    // Sustained activity bonus (0-0.2)
    if (activityPattern === 'sustained' && avgMessagesPerSecond > baselineActivity.avgMessagesPerSecond * 1.5) {
      confidence += 0.2;
    } else if (activityPattern === 'spike') {
      confidence += 0.15;
    } else {
      confidence += 0.1;
    }
    
    // User engagement (0-0.2)
    const userEngagementRatio = uniqueUsers / Math.max(messageCount, 1);
    confidence += Math.min(userEngagementRatio * 0.3, 0.2);
    
    // Emote intensity (0-0.2)
    if (emoteAnalysis.isBurst) {
      confidence += 0.2;
    } else {
      const emoteScore = Math.min(emoteAnalysis.emoteDensity, 1) * 0.1 +
                        Math.min(emoteAnalysis.uniqueEmotes.length / 5, 1) * 0.1;
      confidence += emoteScore;
    }
    
    // Sentiment impact (0-0.05)
    if (Math.abs(sentimentScore) > 0.5) {
      confidence += 0.05;
    }
    
    return Math.min(Math.max(confidence, 0), 1);
  }


  private determineHighlightReason(
    messageCount: number,
    avgMessagesPerSecond: number,
    sentiment: number,
    emoteAnalysis: EmoteAnalysis,
    peakActivity: number,
    activityPattern: 'spike' | 'sustained' | 'gradual'
  ): string {
    const reasons: string[] = [];
    
    // Activity pattern based reasons
    if (activityPattern === 'spike' && peakActivity > avgMessagesPerSecond * this.SPIKE_THRESHOLD_MULTIPLIER) {
      reasons.push('sudden activity spike');
    } else if (activityPattern === 'sustained') {
      reasons.push('sustained high activity');
    } else if (messageCount >= this.MIN_MESSAGES_FOR_SPIKE) {
      reasons.push('increased activity');
    }
    
    // Sentiment based reasons
    if (sentiment > 0.7) {
      reasons.push('extremely positive reaction');
    } else if (sentiment > 0.5) {
      reasons.push('positive reaction');
    } else if (sentiment < -0.5) {
      reasons.push('dramatic moment');
    }
    
    // Emote based reasons
    if (emoteAnalysis.isBurst) {
      const dominantCategory = Object.entries(emoteAnalysis.emoteCategories)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (dominantCategory && dominantCategory[1] > 0) {
        switch (dominantCategory[0]) {
          case 'hype':
            reasons.push('hype explosion');
            break;
          case 'laugh':
            reasons.push('comedy gold moment');
            break;
          case 'surprise':
            reasons.push('shocking moment');
            break;
          case 'celebration':
            reasons.push('celebration burst');
            break;
        }
      } else {
        reasons.push('emote explosion');
      }
    } else if (emoteAnalysis.uniqueEmotes.length >= 5) {
      reasons.push('diverse emote reaction');
    } else if (emoteAnalysis.emoteDensity > 0.5) {
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
      
      // If highlights are within MERGE_THRESHOLD seconds of each other, merge them
      if (next.timestamp - current.endTimestamp <= this.MERGE_THRESHOLD * 1000) {
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