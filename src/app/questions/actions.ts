// この中の関数は必ずサーバー側で実行される
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 指定したidの設問を削除する
// 設問を削除する前に、それに紐づく選択肢(choices)も削除する必要がある
// (外部キー制約により、参照されている側を先に消さないとエラーになるため。
//  これはSQLの章で学んだ「子テーブルから先に削除する」ルールと同じ)
export async function deleteQuestion(questionId: number) {
  // 先に選択肢(子)を削除
  await prisma.choice.deleteMany({
    where: { questionId },
  });

  // その後、設問(親)を削除
  await prisma.question.delete({
    where: { id: questionId },
  });

  // このページのキャッシュを更新し、削除結果を画面にすぐ反映させる
  revalidatePath("/questions");
}