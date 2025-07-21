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

export class TwitchAPIClient {
  private accessToken: string;
  private clientId: string;

  constructor(accessToken: string, clientId: string) {
    this.accessToken = accessToken;
    this.clientId = clientId;
  }

  private async fetchTwitchAPI<T>(endpoint: string): Promise<T> {
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

  async getVODs(userId: string, limit = 20): Promise<TwitchVOD[]> {
    const vods = await this.fetchTwitchAPI<TwitchVOD[]>(
      `/videos?user_id=${userId}&type=archive&first=${limit}`
    );
    
    return vods.filter(vod => vod.viewable === 'public');
  }

  async getVODById(vodId: string): Promise<TwitchVOD | null> {
    const vods = await this.fetchTwitchAPI<TwitchVOD[]>(`/videos?id=${vodId}`);
    return vods.length > 0 ? vods[0] : null;
  }

  async getChatReplay(vodId: string): Promise<TwitchChatMessage[]> {
    // Note: Twitch doesn't provide a direct API for chat replay
    // In production, you would need to use a third-party service like:
    // - Twitch API v5 (deprecated but still works for some endpoints)
    // - Third-party chat replay services
    // - Your own chat recording system
    
    // For now, we'll return a mock implementation
    // In real implementation, you'd fetch from a service like:
    // https://api.twitch.tv/v5/videos/${vodId}/comments?content_offset_seconds=0
    
    console.warn('Chat replay not implemented - using mock data');
    return [];
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

  private parseDuration(duration: string): number {
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
    
    return users.length > 0 ? users[0] : null;
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
}