import { prisma } from "@/lib/prisma";
import { DeleteButton } from "./DeleteButton";
import styles from "./questions.module.css";
import Link from "next/link";

// asyncを付けているのは、この中でDBへの問い合わせ(await)を行うため
export default async function QuestionsPage() {
  // 登録済みの全設問を、カテゴリー情報も一緒に取得する
  // (一覧に「地理」のようなカテゴリー名も表示したいため)
  const questions = await prisma.question.findMany({
    include: {
      category: true, // 設問に紐づくカテゴリーの情報も一緒に取得する
    },
    orderBy: { id: "desc" }, // 新しく登録したものが上に来るようにする
  });

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>登録済みの問題</h1>
        <Link href="/questions/new" className={styles.newLink}>
          + 新規作成
        </Link>
      </div>

      {questions.length === 0 ? (
        <p className={styles.emptyState}>まだ問題が登録されていません。</p>
      ) : (
        <ul className={styles.list}>
          {questions.map((question) => (
            <li key={question.id} className={styles.item}>
              <div className={styles.itemBody}>
                <div className={styles.itemCategory}>
                  {question.category.name}
                </div>
                <div className={styles.itemText}>
                  {question.questionText}
                </div>
              </div>
              {/* 削除ボタンはクリック操作が必要なのでクライアントコンポーネントに分ける */}
              <DeleteButton questionId={question.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}