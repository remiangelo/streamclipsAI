'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatActivityChart } from '@/components/ui/chat-activity-chart'
import { HighlightPreview } from '@/components/ui/highlight-preview'
import { ChatAnalyzer, ChatMessage, HighlightMoment } from '@/lib/chat-analyzer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Sparkles } from 'lucide-react'

// Sample chat data for testing
const SAMPLE_CHAT_DATA = `0,user1,Stream starting soon!
5000,user2,Hey everyone!
10000,user3,First!
60000,user1,OMG WHAT A PLAY
60100,user2,NO WAY
60200,user3,POGGERS POGGERS
60300,user4,CLIP IT
60400,user5,INSANE!!!
60500,user6,PogChamp PogChamp PogChamp
60600,user7,LETS GOOOOO
60700,user8,THAT WAS SICK
60800,user9,KEKW KEKW
60900,user10,NO SHOT
61000,user11,GIGACHAD PLAY
61100,user12,5Head 5Head
61200,user13,EZ Clap
120000,user1,gg that was fun
125000,user2,great stream
180000,user1,RIP
180100,user2,F in chat
180200,user3,sadge
180300,user4,NotLikeThis
180400,user5,pepehands
180500,user6,that was so close
180600,user7,NOOOO
180700,user8,unlucky`

export default function AnalyzerPage() {
  const [chatInput, setChatInput] = useState(SAMPLE_CHAT_DATA)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [highlights, setHighlights] = useState<HighlightMoment[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeChatData = () => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      // Parse the chat data
      const lines = chatInput.trim().split('\n')
      const parsedMessages: ChatMessage[] = []
      
      for (const line of lines) {
        const parts = line.split(',')
        if (parts.length >= 3) {
          const timestamp = parseInt(parts[0])
          const username = parts[1]
          const message = parts.slice(2).join(',')
          
          if (!isNaN(timestamp)) {
            parsedMessages.push({
              timestamp,
              username,
              message,
              emotes: extractEmotesFromMessage(message)
            })
          }
        }
      }
      
      if (parsedMessages.length === 0) {
        throw new Error('No valid messages found. Please check the format.')
      }
      
      // Sort messages by timestamp
      parsedMessages.sort((a, b) => a.timestamp - b.timestamp)
      
      // Analyze the chat
      const analyzer = new ChatAnalyzer()
      const detectedHighlights = analyzer.analyzeChatSpikes(parsedMessages)
      
      setMessages(parsedMessages)
      setHighlights(detectedHighlights)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze chat data')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const vodDuration = messages.length > 0 
    ? messages[messages.length - 1].timestamp + 30000 
    : 240000

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat Analyzer Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the AI-powered chat analysis engine with sample data or your own chat logs
        </p>
      </div>

      <Tabs defaultValue="input" className="w-full">
        <TabsList>
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="results" disabled={highlights.length === 0}>
            Results {highlights.length > 0 && <Badge className="ml-2">{highlights.length}</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Data Input</CardTitle>
              <CardDescription>
                Enter chat messages in CSV format: timestamp,username,message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="timestamp,username,message"
                className="font-mono text-sm min-h-[300px]"
              />
              
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Button
                  onClick={analyzeChatData}
                  disabled={isAnalyzing || !chatInput.trim()}
                >
                  {isAnalyzing ? (
                    <>Analyzing...</>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Chat
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setChatInput(SAMPLE_CHAT_DATA)}
                >
                  Load Sample Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          {messages.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Total Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{messages.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Highlights Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {highlights.length}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">VOD Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatDuration(vodDuration)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <ChatActivityChart
                messages={messages}
                highlights={highlights}
                vodDuration={vodDuration}
              />
              
              {highlights.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Detected Highlights</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {highlights.map((highlight, index) => (
                      <HighlightPreview
                        key={index}
                        highlight={highlight}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function extractEmotesFromMessage(message: string): string[] {
  const emotes: string[] = []
  const knownEmotes = ['PogChamp', 'KEKW', 'LUL', 'OMEGALUL', 'POGGERS', 'Pog', 'EZ', 'Clap', 'monkaS', 'pepeLaugh', 'LULW', 'sadge', 'pepehands', 'NotLikeThis', '5Head', 'GIGACHAD']
  
  knownEmotes.forEach(emote => {
    if (message.includes(emote)) {
      emotes.push(emote)
    }
  })
  
  return emotes
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}