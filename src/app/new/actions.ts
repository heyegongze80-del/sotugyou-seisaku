// このファイルの中の関数は、必ずサーバー側(app コンテナの中)で実行される、という宣言
// これによりDBへの接続情報などがブラウザ側のJavaScriptに一切漏れない
"use server";

// 先ほど作ったPrismaクライアント(DBとの窓口)を読み込む
import { prisma } from "@/lib/prisma";
// 処理が終わったあとにトップページへ移動させるための関数
import { redirect } from "next/navigation";

// フォームから渡ってくるデータの形を、あらかじめ型として定義しておく
// (TypeScriptの型エイリアス。QuestionForm.tsx側と形を一致させる)
type CreateQuestionInput = {
  category: string;
  question: string;
  choices: string[]; // 4つの選択肢の文字列をまとめた配列
  correctIndex: number; // 正解の選択肢が配列の何番目か(0〜3)
  explanation: string;
};

// asyncを付けているのは、この関数の中でDBへの書き込み(await)を行うため
export async function createQuestion(input: CreateQuestionInput) {
  // 分割代入で、渡ってきたオブジェクトの中身を個別の変数に取り出す
  const { category, question, choices, correctIndex, explanation } = input;

  // 入力チェック:必須項目が空でないか確認する
  // choices.some(...) は「配列の中に1つでも空文字があればtrue」という意味
// 1. カテゴリー、問題文、正解の番号が正しく入っているかチェック
  if (!category) {
    throw new Error("カテゴリーを入力してください。");
  }
  if (!question) {
    throw new Error("問題文を入力してください。");
  }
  if (Number.isNaN(correctIndex)) {
    throw new Error("正解の選択肢を指定してください。");
  }

  // 2. 選択肢（4つ）の中に空っぽのものがないか1つずつチェック
  for (const choice of choices) {
    if (!choice) {
      throw new Error("選択肢は4つすべて入力してください。");
    }
  }

  // カテゴリーが既にあれば使い回し、無ければ新規作成する
  // upsertは「あれば更新(update)、なければ作成(create)」を1回でまとめて行う
  const categoryRecord = await prisma.category.upsert({
    where: { name: category },
    update: {}, // 既にある場合は特に何も変更しない
    create: { name: category },
  });

  // 設問を作成する。同時に4つの選択肢も一緒に作る(ネストしたcreate)
  await prisma.question.create({
    data: {
      categoryId: categoryRecord.id,
      questionText: question,
      // 解説文が空文字の場合は、DBにはnull(未入力)として保存する
      explanation: explanation || null,

      // choicesは1対多のリレーションなので、createManyでまとめて作る
      choices: {
        createMany: {
          data: choices.map((text, index) => ({
            choiceText: text,
            // 配列の添字(index)と、選ばれた正解の番号が一致する行だけtrueにする
            isCorrect: index === correctIndex,
            displayOrder: index,
          })),
        },
      },
    },
  });

  // 保存が終わったら、トップページに戻す
  redirect("/");
}
