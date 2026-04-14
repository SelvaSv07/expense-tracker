"use server";

import { db } from "@/db";
import { goalContributions, goals } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().int().positive(),
  targetDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export async function createGoal(input: z.infer<typeof goalSchema>) {
  const parsed = goalSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  await db.insert(goals).values({
    id,
    userId: session.user.id,
    name: parsed.name,
    targetAmount: parsed.targetAmount,
    savedAmount: 0,
    targetDate: parsed.targetDate ?? null,
    notes: parsed.notes ?? null,
  });
  revalidatePath("/");
  return id;
}

const contribSchema = z.object({
  goalId: z.string(),
  amount: z.number().int().positive(),
  occurredAt: z.coerce.date(),
  note: z.string().optional(),
});

export async function addGoalContribution(input: z.infer<typeof contribSchema>) {
  const parsed = contribSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [g] = await db
    .select()
    .from(goals)
    .where(eq(goals.id, parsed.goalId))
    .limit(1);
  if (!g || g.userId !== session.user.id) throw new Error("Goal not found");

  const cid = crypto.randomUUID();
  await db.insert(goalContributions).values({
    id: cid,
    goalId: parsed.goalId,
    amount: parsed.amount,
    occurredAt: parsed.occurredAt,
    note: parsed.note ?? null,
  });

  await db
    .update(goals)
    .set({
      savedAmount: g.savedAmount + parsed.amount,
      updatedAt: new Date(),
    })
    .where(eq(goals.id, parsed.goalId));

  revalidatePath("/");
}

export async function deleteGoal(goalId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [g] = await db
    .select()
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);
  if (!g || g.userId !== session.user.id) throw new Error("Not found");

  await db.delete(goals).where(eq(goals.id, goalId));
  revalidatePath("/");
}
