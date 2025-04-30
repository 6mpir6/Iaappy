import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { html, css, js, title = "generated-website" } = await request.json()

    if (!html || !css) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a full HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>${title}</title>
 <style>
${css}
 </style>
</head>
<body>
${html}
<script>
${js || "// No JavaScript"}
</script>
</body>
</html>`

    // Return the HTML as a downloadable file
    return new NextResponse(fullHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="${title}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating downloadable website:", error)
    return NextResponse.json({ error: "Failed to generate downloadable website" }, { status: 500 })
  }
}
