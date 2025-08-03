// src/app/api/chat/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    
    // Validate input
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a valid question." }, 
        { status: 400 }
      );
    }

    // Check if n8n webhook URL is configured
    if (!process.env.N8N_WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL is not configured");
      return NextResponse.json(
        { error: "Chatbot service is not properly configured." },
        { status: 500 }
      );
    }

    // Note: Using GET request with query parameters since webhook expects GET

    // Build URL with query parameters for GET request
    const url = new URL(process.env.N8N_WEBHOOK_URL);
    url.searchParams.append('message', question.trim());
    url.searchParams.append('timestamp', new Date().toISOString());
    
    // Make GET request to n8n webhook
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        // Add authentication headers if needed
        ...(process.env.N8N_API_KEY && {
          'Authorization': `Bearer ${process.env.N8N_API_KEY}`
        }),
        // Or basic auth if needed
        ...(process.env.N8N_USERNAME && process.env.N8N_PASSWORD && {
          'Authorization': `Basic ${Buffer.from(`${process.env.N8N_USERNAME}:${process.env.N8N_PASSWORD}`).toString('base64')}`
        }),
      },
      // Set timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.error(`n8n request failed with status: ${response.status}`);
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('n8n error response:', errorText);
      
      // Handle specific n8n errors
      if (response.status === 404) {
        let errorMessage = "Chatbot webhook is not active.";
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.hint && errorData.hint.includes('Execute workflow')) {
            errorMessage = "Chatbot workflow is not active. Please activate the workflow in n8n.";
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: "The n8n workflow needs to be activated or the webhook URL might be incorrect."
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: "Chatbot service is currently unavailable." },
        { status: 502 }
      );
    }

    // Parse the response from n8n
    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle plain text responses
        const textResponse = await response.text();
        data = { message: textResponse };
      }
    } catch (parseError) {
      console.error("Failed to parse n8n response:", parseError);
      const rawText = await response.text().catch(() => 'Unable to read response');
      return NextResponse.json(
        { error: "Invalid response format from chatbot.", raw: rawText },
        { status: 502 }
      );
    }
    
    console.log("n8n response:", JSON.stringify(data, null, 2));
    console.log("Response type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    
    // Extract the answer from n8n response with comprehensive checking
    let answer = null;
    
    if (typeof data === 'string') {
      // Simple string response
      answer = data;
    } else if (Array.isArray(data)) {
      // Array response (common with n8n workflows)
      console.log("Processing array response, length:", data.length);
      if (data.length > 0) {
        const firstItem = data[0];
        console.log("First item:", JSON.stringify(firstItem, null, 2));
        
        // Try multiple possible field names
        answer = firstItem?.answer || 
                firstItem?.response || 
                firstItem?.message || 
                firstItem?.text || 
                firstItem?.output || 
                firstItem?.result ||
                firstItem?.content ||
                firstItem?.reply ||
                (typeof firstItem === 'string' ? firstItem : null);
      }
    } else if (typeof data === 'object' && data !== null) {
      // Object response
      console.log("Processing object response");
      answer = data.answer || 
              data.response || 
              data.message || 
              data.text || 
              data.output || 
              data.result ||
              data.content ||
              data.reply;
      
      // If still no answer, try to extract from nested objects
      if (!answer && data.body) {
        answer = data.body.answer || data.body.response || data.body.message || data.body.text;
      }
    }
    
    console.log("Extracted answer:", answer);
    
    if (!answer || answer.trim().length === 0) {
      console.error("No valid answer found in n8n response");
      console.error("Full response structure:", JSON.stringify(data, null, 2));
      
      return NextResponse.json({
        error: "No response received from chatbot",
        debug: {
          responseType: typeof data,
          isArray: Array.isArray(data),
          keys: typeof data === 'object' && data !== null ? Object.keys(data) : [],
          fullResponse: data
        }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      answer: typeof answer === 'string' ? answer.trim() : String(answer).trim(),
      source: "n8n-chatbot",
      timestamp: new Date().toISOString(),
      debug: {
        originalResponseType: typeof data,
        isArray: Array.isArray(data),
        extractedFrom: Array.isArray(data) ? 'array[0]' : 'object'
      }
    });

  } catch (error) {
    console.error("Chatbot request failed:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: "Request timed out. Please try again." },
          { status: 408 }
        );
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return NextResponse.json(
          { error: "Unable to connect to chatbot service." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Optional: ping your n8n webhook to check if it's alive
    if (process.env.N8N_HEALTH_CHECK_URL) {
      const healthResponse = await fetch(process.env.N8N_HEALTH_CHECK_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout for health check
      });
      
      if (healthResponse.ok) {
        return NextResponse.json({ 
          status: "Chat API is running",
          n8n_status: "healthy",
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return NextResponse.json({ 
      status: "Chat API is running",
      n8n_status: "unknown",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({ 
      status: "Chat API is running",
      n8n_status: "unhealthy",
      timestamp: new Date().toISOString()
    });
  }
}