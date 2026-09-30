import { NextResponse } from 'next/server';

export async function GET() {
  const workflowApiUrl = process.env.WORKFLOW_API_URL;
  const cloudBrowserUrl = process.env.CLOUD_BROWSER_URL;
  const cloudBrowserApiKey = process.env.CLOUD_BROWSER_API_KEY;
  
  return NextResponse.json({
    hasWorkflowApiUrl: !!workflowApiUrl,
    workflowApiUrlLength: workflowApiUrl?.length || 0,
    workflowApiUrlPreview: workflowApiUrl 
      ? `${workflowApiUrl.substring(0, 30)}...` 
      : 'NOT SET',
    hasCloudBrowserUrl: !!cloudBrowserUrl,
    cloudBrowserUrl: cloudBrowserUrl || 'NOT SET',
    hasCloudBrowserApiKey: !!cloudBrowserApiKey,
    cloudBrowserApiKeyLength: cloudBrowserApiKey?.length || 0,
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('WORKFLOW') || k.includes('API') || k.includes('CLOUD_BROWSER')
    ),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
