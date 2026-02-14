import { copyFile, mkdir, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { recordEvidence } from "./evidence.js";

const devtoolsBaseDir = resolve(process.cwd(), "docs/generated/devtools");

export type RegisterDevtoolsParams = {
  traceId: string;
  sourcePath: string;
  label?: string;
};

export async function registerDevtoolsArtifact(
  params: RegisterDevtoolsParams
): Promise<string> {
  await stat(params.sourcePath);
  await mkdir(devtoolsBaseDir, { recursive: true });
  const destFile = `${params.traceId}-${Date.now()}-${basename(params.sourcePath)}`;
  const destPath = resolve(devtoolsBaseDir, destFile);
  await copyFile(params.sourcePath, destPath);

  await recordEvidence({
    traceId: params.traceId,
    kind: "devtools",
    reference: destPath,
    status: "recorded",
    metadata: params.label ? { label: params.label } : {},
  });

  return destPath;
}
