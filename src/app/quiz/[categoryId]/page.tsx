// notFoundは「該当データが無い場合に404ページを表示する」ためのNext.js標準の関数
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuizClient } from "./QuizClient";

// Next.jsのApp Routerでは、フォルダ名の[categoryId]がそのままURLの動的な部分になる
// 例: /quiz/1 にアクセスすると、categoryId には "1" という文字列が入ってくる
export default async function QuizPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  // paramsはPromise(非同期の値)なので、awaitで中身を取り出す
  const { categoryId } = await params;

  // URLから来る値は必ず文字列なので、数値に変換する
  const categoryIdNumber = Number(categoryId);

  // 該当カテゴリーと、それに紐づく設問・選択肢を一度に取得する
  const category = await prisma.category.findUnique({
    where: { id: categoryIdNumber },
    include: {questions: {include:{choices:{
            // 選択肢はdisplay_orderの昇順(登録順)に並べる
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { id: "asc" },
      },},}
    );

  // 存在しないカテゴリーIDが指定された場合(例: /quiz/999)は404を表示する
  if (!category) {
    notFound();
  }

  // そのカテゴリーに問題が1問も無い場合も、専用の案内を出す
  if (category.questions.length === 0) {
    return (
      <main>
        <p>「{category.name}」にはまだ問題が登録されていません。</p>
      </main>
    );
  }

  // ここまでで取得したデータを、実際に画面を動かすクライアントコンポーネントに渡す
  return (
    <QuizClient categoryId={categoryIdNumber} 
    categoryName={category.name}
    questions={category.questions} />
  );
}