import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        modalities: ["audio", "text"],
        instructions: `You are a helpful e-commerce assistant. You can help users find products, add them to their cart, initiate checkout, start a visualization, add products to the visualization, and change the color of a product. Use the provided tools to fulfill user requests. Reference the knowledge base to answer questions about products and policies.`,
        voice: "alloy",
        tools: [
          {
            type: "function",
            name: "recommend_products",
            description: "Recommend products based on user request and specifications",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query for products",
                },
                category: {
                  type: "string",
                  description: "The category of products to search for",
                },
                max: {
                  type: "integer",
                  description: "Maximum number of results to return",
                },
              },
              required: ["query"],
            },
          },
          {
            type: "function",
            name: "add_to_cart",
            description: "Add a product to the cart",
            parameters: {
              type: "object",
              properties: {
                product_id: {
                  type: "string",
                  description: "The ID of the product to add to the cart",
                },
                quantity: {
                  type: "integer",
                  description: "The quantity of the product to add",
                },
              },
              required: ["product_id", "quantity"],
            },
          },
          {
            type: "function",
            name: "initiate_checkout",
            description: "Initiate the checkout process",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            type: "function",
            name: "start_visualization",
            description: "Start a visualization with the selected products",
            parameters: {
              type: "object",
              properties: {
                product_ids: {
                  type: "array",
                  items: {
                    type: "string",
                    description: "The IDs of the products to include in the visualization",
                  },
                },
              },
              required: ["product_ids"],
            },
          },
          {
            type: "function",
            name: "add_product_to_visualization",
            description: "Add a product to the visualization",
            parameters: {
              type: "object",
              properties: {
                product_id: {
                  type: "string",
                  description: "The ID of the product to add to the visualization",
                },
              },
              required: ["product_id"],
            },
          },
          {
            type: "function",
            name: "change_product_color",
            description: "Change the color of a product in the visualization",
            parameters: {
              type: "object",
              properties: {
                product_id: {
                  type: "string",
                  description: "The ID of the product to change the color of",
                },
                color: {
                  type: "string",
                  description: "The hex code of the new color",
                },
              },
              required: ["product_id", "color"],
            },
          },
          {
            type: "function",
            name: "get_knowledge_base",
            description: "Retrieve information from the knowledge base",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query for the knowledge base",
                },
              },
              required: ["query"],
            },
          },
        ],
        tool_choice: "auto",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
          interrupt_response: true,
        },
        input_audio_transcription: {
          model: "gpt-4o-transcribe",
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating realtime session:", error)
    return NextResponse.json({ error: "Failed to create realtime session" }, { status: 500 })
  }
}
