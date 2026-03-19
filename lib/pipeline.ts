import { PipelineItem } from "./types";

const PIPELINE_KEY = "rockland-pipeline";

export function getPipeline(): PipelineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PIPELINE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToPipeline(item: PipelineItem): PipelineItem[] {
  const pipeline = getPipeline();
  // Don't duplicate
  if (pipeline.some((p) => p.grantId === item.grantId)) {
    return pipeline;
  }
  const updated = [...pipeline, item];
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(updated));
  return updated;
}

export function updatePipelineItem(
  grantId: string,
  updates: Partial<Pick<PipelineItem, "status" | "nextStep" | "note">>
): PipelineItem[] {
  const pipeline = getPipeline();
  const updated = pipeline.map((p) =>
    p.grantId === grantId ? { ...p, ...updates } : p
  );
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeFromPipeline(grantId: string): PipelineItem[] {
  const pipeline = getPipeline().filter((p) => p.grantId !== grantId);
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(pipeline));
  return pipeline;
}

export function isInPipeline(grantId: string): boolean {
  return getPipeline().some((p) => p.grantId === grantId);
}
