import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import {
  isOpenAIConfigured,
  resolveOpenAIEmbeddingModel,
  resolveOpenAIModel,
} from "@/lib/openai-config";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      openaiModel: settings.openaiModel,
      embeddingModel: settings.embeddingModel,
      serverOpenAIConfigured: isOpenAIConfigured(),
      activeOpenAIModel: resolveOpenAIModel(settings.openaiModel),
      activeEmbeddingModel: resolveOpenAIEmbeddingModel(settings.embeddingModel),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = await updateSettings({
      openaiModel: body.openaiModel ?? undefined,
      embeddingModel: body.embeddingModel ?? undefined,
    });

    return NextResponse.json({
      openaiModel: settings.openaiModel,
      embeddingModel: settings.embeddingModel,
      serverOpenAIConfigured: isOpenAIConfigured(),
      activeOpenAIModel: resolveOpenAIModel(settings.openaiModel),
      activeEmbeddingModel: resolveOpenAIEmbeddingModel(settings.embeddingModel),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 400 }
    );
  }
}
