import { NextResponse } from "next/server";

type RunPayload = {
  keywords?: string[];
  count?: number;
  messages?: string[];
  names?: string[];
  emails?: string[];
  subjects?: string[];
  phone?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as RunPayload;
  
  // If WORKFLOW_API_URL is set, forward to local workflow service
  const workflowApiUrl = process.env.WORKFLOW_API_URL;
  
  if (workflowApiUrl) {
    try {
      const response = await fetch(`${workflowApiUrl}/api/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Workflow service returned ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error('Failed to connect to workflow service:', error);
      // Fall through to local preview mode
    }
  }
  
  // Local preview mode (when workflow service is unavailable)
  const count = Math.min(20, Math.max(1, Number(payload.count) || 1));
  const keywords = (payload.keywords ?? []).filter(Boolean);
  const subjects = (payload.subjects ?? []).filter(Boolean);
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    results: Array.from({ length: count }, (_, index) => ({
      seller: `Seller ${index + 1}`,
      keyword: keywords[index % Math.max(keywords.length, 1)] ?? "",
      subject: subjects[index % Math.max(subjects.length, 1)] ?? "",
      timestamp,
      status: "skipped" as const,
      reason: "Local preview: seller workflow is not connected.",
    })),
  });
}
