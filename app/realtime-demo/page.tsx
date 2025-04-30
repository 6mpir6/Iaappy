import RealtimeChat from "@/components/realtime-chat"

export default function RealtimeDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">OpenAI Realtime API Demo</h1>
          <p className="text-lg text-muted-foreground mb-4">
            This demo showcases the OpenAI Realtime API for speech-to-speech conversations with function calling
            capabilities.
          </p>
          <div className="bg-amber-100 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-900">
            <h3 className="font-medium text-amber-800 dark:text-amber-300">Features</h3>
            <ul className="list-disc list-inside text-amber-700 dark:text-amber-400 mt-2 space-y-1">
              <li>Real-time speech-to-speech conversations</li>
              <li>Text input and output</li>
              <li>Voice selection (alloy, echo, fable, etc.)</li>
              <li>Function calling for external tools</li>
              <li>Voice activity detection</li>
            </ul>
          </div>
        </div>

        <RealtimeChat />
      </div>
    </div>
  )
}
