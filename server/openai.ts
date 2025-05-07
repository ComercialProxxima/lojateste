import OpenAI from "openai";
import { type TranscriptLine } from "@shared/schema";
import fs from "fs";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "your-api-key" });

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });
    
    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

export interface ProcessedTranscript {
  lines: {
    timestamp: number;
    speaker: string;
    content: string;
    isActionItem: boolean;
    actionAssignee?: string;
  }[];
  summary: string;
}

export async function processTranscript(transcriptText: string): Promise<ProcessedTranscript> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
          `You are a professional meeting transcript processor. 
          Given a meeting transcript, process it into structured data with the following:
          1. Split into lines by speaker
          2. Identify action items (tasks that need to be done)
          3. Identify who each action item is assigned to (if specified)
          4. Create a brief summary of the meeting (max 300 words)
          5. Estimate timestamps in seconds for each line
          
          Respond in JSON format with this structure:
          {
            "lines": [
              {
                "timestamp": number (seconds),
                "speaker": "string (name and role if available)",
                "content": "string (what was said)",
                "isActionItem": boolean,
                "actionAssignee": "string (name of person assigned, if applicable)" 
              }
            ],
            "summary": "string (meeting summary)"
          }`
        },
        {
          role: "user",
          content: transcriptText
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Error processing transcript:", error);
    throw new Error(`Failed to process transcript: ${error.message}`);
  }
}

export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ].join(':');
}

export function secondsFromTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  
  if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else {
    return 0;
  }
}
