import { existsSync } from "node:fs";
import type { EpisodeRecord } from "../types";

/**
 * Optional Prisma persistence. File JSON is the source of truth during the
 * experiment so Review works without a running database. When Prisma is
 * generated and DATABASE_URL is set, we mirror the episode.
 */
export async function syncEpisodeToPrisma(record: EpisodeRecord): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const project = await prisma.project.upsert({
      where: { id: "default-series" },
      create: { id: "default-series", name: "Default series" },
      update: {},
    });

    await prisma.episode.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        projectId: project.id,
        title: record.title,
        language: record.language,
        scriptText: record.scriptText,
      },
      update: {
        title: record.title,
        language: record.language,
        scriptText: record.scriptText,
      },
    });

    await prisma.scene.deleteMany({ where: { episodeId: record.id } });
    await prisma.dialogueLine.deleteMany({ where: { episodeId: record.id } });
    await prisma.sfxEvent.deleteMany({ where: { episodeId: record.id } });

    for (const scene of record.plan.scenes) {
      await prisma.scene.create({
        data: {
          episodeId: record.id,
          index: scene.index,
          heading: scene.heading,
          ambience: scene.ambience,
        },
      });
    }

    for (const line of record.plan.lines) {
      await prisma.dialogueLine.create({
        data: {
          episodeId: record.id,
          sceneIndex: line.sceneIndex,
          order: line.order,
          character: line.character,
          text: line.text,
          emotion: line.emotion,
          pronunciationHints: line.pronunciationHints,
          pace: line.delivery?.pace,
          intensity: line.delivery?.intensity,
          status: record.lineStatuses[line.order] ?? "pending",
          audioPath: record.lineAudio[line.order],
        },
      });
    }

    for (const sfx of record.plan.sfx) {
      await prisma.sfxEvent.create({
        data: {
          episodeId: record.id,
          tag: sfx.tag,
          sceneIndex: sfx.sceneIndex,
          afterLineIndex: sfx.afterLineIndex,
        },
      });
    }

    if (record.mixMp3 && existsSync(record.mixMp3)) {
      await prisma.audioAsset.create({
        data: {
          episodeId: record.id,
          kind: "mix_mp3",
          path: record.mixMp3,
          durationMs: record.generation?.durationMs ?? 0,
        },
      });
    }

    if (record.generation) {
      for (const line of record.generation.lines) {
        await prisma.generationJob.create({
          data: {
            episodeId: record.id,
            provider: line.provider,
            chars: line.characters,
            durationMs: line.durationMs,
            latencyMs: line.latencyMs,
            costInr: line.costInr,
            voice: line.voice,
            language: line.language,
            error: line.error,
          },
        });
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.warn("Prisma sync skipped:", error instanceof Error ? error.message : error);
  }
}
