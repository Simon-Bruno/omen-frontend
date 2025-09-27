import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Return a welcome message in the format expected by assistant-ui
        const welcomeMessage = {
            role: "assistant",
            content: [
                {
                    type: "text",
                    text: "Hi there! I’m Omen—your AI growth partner, here to help turn more of your visitors into customers. I just ran a deep dive on your store and built a brand analysis. Want me to walk you through the findings? Once we’ve covered that, we’ll move straight into experiments—because every moment without testing is lost opportunity, and from what I’ve seen, there are some big wins waiting for us."
                }
            ]
        };

        return NextResponse.json(welcomeMessage);
    } catch (error) {
        console.error("Error generating welcome message:", error);
        return NextResponse.json(
            { error: "Failed to generate welcome message" },
            { status: 500 }
        );
    }
}
