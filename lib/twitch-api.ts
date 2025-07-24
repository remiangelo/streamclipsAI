interface TwitchVOD {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  created_at: string;
  published_at: string;
  url: string;
  thumbnail_url: string;
  viewable: string;
  view_count: number;
  language: string;
  type: string;
  duration: string;
}

interface TwitchChatMessage {
  _id: string;
  created_at: string;
  updated_at: string;
  channel_id: string;
  content_type: string;
  content_id: string;
  content_offset_seconds: number;
  commenter: {
    display_name: string;
    _id: string;
    name: string;
    type: string;
  };
  source: string;
  state: string;
  message: {
    body: string;
    fragments: Array<{
      text: string;
      emoticon?: {
        emoticon_id: string;
        emoticon_set_id: string;
      };
    }>;
    is_action: boolean;
    user_badges?: Array<{
      _id: string;
      version: string;
    }>;
    user_color?: string;
  };
}

interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number;
}

export class TwitchAPIClient {
  private accessToken: string = '';
  private clientId: string;
  private clientSecret: string;

  constructor(config: { clientId: string; clientSecret: string } | { accessToken: string; clientId: string }) {
    if ('accessToken' in config) {
      this.accessToken = config.accessToken;
      this.clientId = config.clientId;
      this.clientSecret = '';
    } else {
      this.clientId = config.clientId;
      this.clientSecret = config.clientSecret;
    }
  }

  private async ensureAccessToken(): Promise<void> {
    if (this.accessToken) return;

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }

  private async fetchTwitchAPI<T>(endpoint: string): Promise<T> {
    await this.ensureAccessToken();

    const response = await fetch(`https://api.twitch.tv/helix${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Client-ID': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data as T;
  }

  async getVODs(userId: string, accessToken: string, limit = 20): Promise<{ data: TwitchVOD[], pagination: any }> {
    const vods = await this.fetchTwitchAPI<TwitchVOD[]>(
      `/videos?user_id=${userId}&type=archive&first=${limit}`
    );
    
    return {
      data: vods || [],
      pagination: {}
    };
  }

  async getVODById(vodId: string): Promise<TwitchVOD | null> {
    const vods = await this.fetchTwitchAPI<TwitchVOD[]>(`/videos?id=${vodId}`);
    return vods && vods.length > 0 ? vods[0] : null;
  }

  async getChatReplay(vodId: string): Promise<Array<{
    timestamp: number;
    username: string;
    message: string;
    emotes?: string[];
  }>> {
    // Using a third-party service for chat replay (TwitchRecover API)
    // Note: In production, you might want to use your own chat recording system
    try {
      const vod = await this.getVODById(vodId);
      if (!vod) {
        throw new Error('VOD not found');
      }

      // Get chat logs from TwitchRecover API (unofficial but reliable)
      const chatUrl = `https://api.twitchrecover.com/vodchat/${vodId}`;
      const response = await fetch(chatUrl);
      
      if (!response.ok) {
        // Fallback to v5 API (deprecated but still works)
        return this.getChatReplayV5(vodId);
      }

      const chatData = await response.json();
      
      // Transform to our format
      return chatData.comments.map((comment: any) => ({
        timestamp: comment.content_offset_seconds * 1000,
        username: comment.commenter.display_name || comment.commenter.name,
        message: comment.message.body,
        emotes: this.extractEmotes(comment.message.fragments || [])
      }));
    } catch (error) {
      console.error('Failed to fetch chat replay:', error);
      // Return empty array instead of mock data in production
      return [];
    }
  }

  private async getChatReplayV5(vodId: string): Promise<Array<{
    timestamp: number;
    username: string;
    message: string;
    emotes?: string[];
  }>> {
    try {
      // Twitch v5 API endpoint (deprecated but functional)
      const response = await fetch(
        `https://api.twitch.tv/v5/videos/${vodId}/comments?content_offset_seconds=0`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Accept': 'application/vnd.twitchtv.v5+json'
          }
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const messages: any[] = [];
      
      // Process paginated results
      let cursor = data._next;
      messages.push(...data.comments);
      
      // Fetch additional pages (limit to prevent too many requests)
      let pageCount = 0;
      while (cursor && pageCount < 100) {
        const nextResponse = await fetch(
          `https://api.twitch.tv/v5/videos/${vodId}/comments?cursor=${cursor}`,
          {
            headers: {
              'Client-ID': this.clientId,
              'Accept': 'application/vnd.twitchtv.v5+json'
            }
          }
        );
        
        if (!nextResponse.ok) break;
        
        const nextData = await nextResponse.json();
        messages.push(...nextData.comments);
        cursor = nextData._next;
        pageCount++;
      }
      
      return messages.map((comment: any) => ({
        timestamp: comment.content_offset_seconds * 1000,
        username: comment.commenter.display_name || comment.commenter.name,
        message: comment.message.body,
        emotes: this.extractEmotes(comment.message.fragments || [])
      }));
    } catch (error) {
      console.error('V5 API failed:', error);
      return [];
    }
  }

  private extractEmotes(fragments: Array<{text: string; emoticon?: {emoticon_id: string}}>): string[] {
    return fragments
      .filter(f => f.emoticon)
      .map(f => f.text);
  }

  async getVODMetadata(vodId: string): Promise<{
    title: string;
    duration: number;
    thumbnail: string;
    gameCategory?: string;
    viewCount: number;
    createdAt: Date;
  } | null> {
    const vod = await this.getVODById(vodId);
    
    if (!vod) {
      return null;
    }

    return {
      title: vod.title,
      duration: this.parseDuration(vod.duration),
      thumbnail: vod.thumbnail_url.replace('%{width}', '1920').replace('%{height}', '1080'),
      viewCount: vod.view_count,
      createdAt: new Date(vod.created_at),
    };
  }

  parseDuration(duration: string): number {
    // Parse Twitch duration format (e.g., "3h21m33s")
    const match = duration.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  async getUserByUsername(username: string): Promise<{ id: string; display_name: string } | null> {
    const users = await this.fetchTwitchAPI<Array<{ id: string; display_name: string }>>(
      `/users?login=${username}`
    );
    
    if (!users || users.length === 0) {
      throw new Error('User not found');
    }
    
    return users[0];
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch('https://id.twitch.tv/oauth2/validate', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  async getClips(broadcasterId: string, startedAt?: Date, endedAt?: Date): Promise<TwitchClip[]> {
    let endpoint = `/clips?broadcaster_id=${broadcasterId}`;
    
    if (startedAt) {
      endpoint += `&started_at=${startedAt.toISOString()}`;
    }
    if (endedAt) {
      endpoint += `&ended_at=${endedAt.toISOString()}`;
    }
    
    return this.fetchTwitchAPI<TwitchClip[]>(endpoint);
  }

  async getVODDownloadUrl(vodId: string): Promise<string | null> {
    // Note: Direct VOD URLs require special authentication
    // In production, you'd use a service like youtube-dl or streamlink
    const vod = await this.getVODById(vodId);
    if (!vod) return null;
    
    // This is a placeholder - actual implementation would use
    // a service to get the m3u8 playlist URL
    return `https://usher.ttvnw.net/vod/${vodId}.m3u8`;
  }
}