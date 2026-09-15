// この中の関数は必ずサーバー側で実行される
"use server";

import { prisma } from "@/lib/prisma";

// クイズ開始時に呼ぶ関数
// 「挑戦履歴」を1行作り、その行のidを返す
// (このあと回答を記録する際に、どの挑戦の一部かを紐づけるために必要)
export async function startQuizAttempt(
  categoryId: number,
  totalQuestions: number
) {
  const attempt = await prisma.quizAttempt.create({
    data: {
      categoryId,
      totalQuestions,
      // correctCountはデフォルト0、finishedAtは未設定(null)のまま作られる
      // (schema.prismaで@default(0)、DateTime?としているため)
    },
  });
  return attempt.id;
}

// 1問回答するたびに呼ぶ関数
// 「回答明細」を1行追加する
export async function recordQuizAnswer(input: {
  attemptId: number;
  questionId: number;
  choiceId: number;
  isCorrect: boolean;
}) {
  await prisma.quizAnswer.create({ data: input });
}

// 全問終わったときに呼ぶ関数
// 「挑戦履歴」の正解数と終了日時を確定させる
export async function finishQuizAttempt(
  attemptId: number,
  correctCount: number
) {
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      correctCount,
      finishedAt: new Date(),
    },
  });
}