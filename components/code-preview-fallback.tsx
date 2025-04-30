"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CodePreviewProps {
  html: string
  css: string
  js: string
}

export function CodePreviewFallback({ html, css, js }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState("html")

  // Helper function to format code for display
  const formatCodeForDisplay = (code: string) => {
    return code.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>").replace(/\s{2}/g, "&nbsp;&nbsp;")
  }

  return (
    <div className="h-[600px] overflow-hidden flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-md">
      <Tabs defaultValue="html" onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 w-full justify-start rounded-none p-0 flex-shrink-0">
          <TabsTrigger
            value="html"
            className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-500 dark:text-gray-400 rounded-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            HTML
          </TabsTrigger>
          <TabsTrigger
            value="css"
            className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-500 dark:text-gray-400 rounded-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            CSS
          </TabsTrigger>
          <TabsTrigger
            value="js"
            className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-500 dark:text-gray-400 rounded-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            JavaScript
          </TabsTrigger>
        </TabsList>

        {/* Use min-h-0 on content parent for flexbox growth */}
        <div className="flex-grow min-h-0">
          <TabsContent value="html" className="h-full p-0 m-0 overflow-auto focus:outline-none">
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 overflow-auto h-full text-sm font-mono whitespace-pre-wrap">
              {html || "<!-- No HTML generated -->"}
            </pre>
          </TabsContent>

          <TabsContent value="css" className="h-full p-0 m-0 overflow-auto focus:outline-none">
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 overflow-auto h-full text-sm font-mono whitespace-pre-wrap">
              {css || "/* No CSS generated */"}
            </pre>
          </TabsContent>

          <TabsContent value="js" className="h-full p-0 m-0 overflow-auto focus:outline-none">
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 overflow-auto h-full text-sm font-mono whitespace-pre-wrap">
              {js || "// No JavaScript generated"}
            </pre>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
