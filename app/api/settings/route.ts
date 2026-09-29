import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Read settings from file if it exists
    const settingsPath = path.join(process.cwd(), '.campaign-settings.json');
    
    try {
      const data = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(data);
      return NextResponse.json({ success: true, settings });
    } catch {
      return NextResponse.json({ 
        success: false, 
        error: 'No settings found. Configure via web UI first.' 
      }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const settings = await request.json();
    
    // Save settings to file for recurring task to read
    const settingsPath = path.join(process.cwd(), '.campaign-settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    
    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
