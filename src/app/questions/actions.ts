// この中の関数は必ずサーバー側で実行される
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 指定したidの設問を削除する
// 設問を削除する前に、それを参照している行をすべて削除する必要がある
// (外部キー制約により、参照されている側を先に消さないとエラーになるため。
//  これはSQLの章で学んだ「子テーブルから先に削除する」ルールと同じ)
export async function deleteQuestion(questionId: number) {
  // 削除後に「カテゴリーの問題が0件になったか」を判定するため、先にcategoryIdを控えておく
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { categoryId: true },
  });

  // 最初に回答明細(孫)を削除
  // quiz_answersはquestionIdとchoiceIdの両方でこの設問を参照しているため、
  // 選択肢を消す前にここを消しておかないと外部キー制約でエラーになる
  await prisma.quizAnswer.deleteMany({
    where: { questionId },
  });

  // 次に選択肢(子)を削除
  await prisma.choice.deleteMany({
    where: { questionId },
  });

  // 最後に設問(親)を削除
  await prisma.question.delete({
    where: { id: questionId },
  });

  if (question) {
    // このカテゴリーに残っている問題数を数える
    const remainingQuestions = await prisma.question.count({
      where: { categoryId: question.categoryId },
    });

    // 問題が1つも無くなったカテゴリーは、選ぶ意味が無いので自動的に削除する
    if (remainingQuestions === 0) {
      // quiz_attemptsもcategoryIdを参照しているため、
      // カテゴリーを削除する前にこちらも削除しておく必要がある
      // (このカテゴリーの問題は既に全て削除済みなので、
      //  紐づくquiz_answersは各deleteQuestionの実行時にすでに消えている)
      await prisma.quizAttempt.deleteMany({
        where: { categoryId: question.categoryId },
      });

      await prisma.category.delete({
        where: { id: question.categoryId },
      });
    }
  }

  // 問題一覧とトップページ(カテゴリー一覧)の両方のキャッシュを更新する
  revalidatePath("/questions");
  revalidatePath("/");
}