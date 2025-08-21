// Server-side models fetching utility
import { models as constantModels } from '../app/constants/models';

// Models that should be categorized as embedding models
const EMBEDDING_MODELS = new Set([
  "BAAI-bge-large-en-v1-5"
]);

export interface ProcessedModel {
  model: string;
  href: string;
  category: 'chat' | 'embedding';
}

export interface ModelsResponse {
  chatModels: ProcessedModel[];
  embeddingModels: ProcessedModel[];
}

async function fetchModelsFromLiteLLM(): Promise<any> {
  if (!process.env.LITELLM_API_ENDPOINT) {
    throw new Error('LITELLM_API_ENDPOINT environment variable is not configured');
  }
  
  if (!process.env.LITELLM_ADMIN_KEY) {
    throw new Error('LITELLM_ADMIN_KEY environment variable is not configured');
  }

  const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/models`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.LITELLM_ADMIN_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('[Models-Server] Failed to fetch models from LiteLLM', {
      status: response.status,
      statusText: response.statusText
    });
    throw new Error(`LiteLLM API returned ${response.status}: ${response.statusText}`);
  }

  const modelsData = await response.json();

  return modelsData;
}

function processModelsData(rawModelsData: any): ModelsResponse {
  if (!rawModelsData?.data || !Array.isArray(rawModelsData.data)) {
    console.warn('[Models-Server] Invalid models data structure', { rawModelsData });
    return { chatModels: [], embeddingModels: [] };
  }

  // Create a lookup map from the constants for URLs
  const constantModelMap = new Map(
    constantModels.map(model => [model.model, model.href])
  );

  const chatModels: ProcessedModel[] = [];
  const embeddingModels: ProcessedModel[] = [];

  rawModelsData.data.forEach((model: any) => {
    const modelId = model.id || model.model || '';
    
    if (!modelId) {
      console.warn('[Models-Server] Model without ID found', { model });
      return;
    }

    const processedModel: ProcessedModel = {
      model: modelId,
      href: constantModelMap.get(modelId) || '#', // Use constant URL or placeholder
      category: EMBEDDING_MODELS.has(modelId) ? 'embedding' : 'chat'
    };

    if (processedModel.category === 'embedding') {
      embeddingModels.push(processedModel);
    } else {
      chatModels.push(processedModel);
    }
  });

  // Sort models alphabetically
  chatModels.sort((a, b) => a.model.localeCompare(b.model));
  embeddingModels.sort((a, b) => a.model.localeCompare(b.model));

  return { chatModels, embeddingModels };
}

export async function getModelsData(): Promise<ModelsResponse> {
  try {
    const rawData = await fetchModelsFromLiteLLM();
    return processModelsData(rawData);
  } catch (error) {
    console.error('[Models-Server] Error fetching models data', { error });
    
    // Return fallback data from constants in case of error
    const fallbackChatModels: ProcessedModel[] = constantModels
      .filter(model => !EMBEDDING_MODELS.has(model.model))
      .map(model => ({
        model: model.model,
        href: model.href,
        category: 'chat' as const
      }));

    const fallbackEmbeddingModels: ProcessedModel[] = constantModels
      .filter(model => EMBEDDING_MODELS.has(model.model))
      .map(model => ({
        model: model.model,
        href: model.href,
        category: 'embedding' as const
      }));

    return { 
      chatModels: fallbackChatModels, 
      embeddingModels: fallbackEmbeddingModels 
    };
  }
}