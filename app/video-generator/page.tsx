import VideoGenerator from "@/components/video-generator/video-generator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Video Generator",
  description: "Generate videos using AI with customizable scenes and themes",
}

export default function VideoGeneratorPage() {
  return <VideoGenerator />
}
