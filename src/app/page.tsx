// Next.jsのリンク機能。<a>タグの代わりに使うことで、ページ全体を再読み込みせずに画面遷移できる
import Link from"next/link";
// 先ほど作ったPrismaクライアント(DBとの窓口)を読み込む
import { prisma } from"@/lib/prisma";
import styles from"./page.module.css";



// asyncを付けているのは、この関数の中でDBへの問い合わせ(await)を行うため
// Next.jsのサーバーコンポーネントは、ページ自体をasync関数にできる
export default async function Home() {
  // categoriesテーブルの全件を取得する
  const categories=await prisma.category.findMany({
    include: {
      // 各カテゴリーに紐づくquestions(設問)の「件数」だけを一緒に取得する
      // 中身の問題文まで全部取得すると重いので、件数だけに絞っている
      //_count　Prismaが自動的に用意している特殊な機能で、「関連するテーブルの行数を数える」ために使います
      _count:{
        select:{questions:true},
      },
    },
    // カテゴリーIDの昇順(登録順)に並べる
    orderBy:{id:"asc"},
  });

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>クイズチャレンジ</h1>
        {/* 問題の作成・削除を行う編集画面へのリンク */}
        <Link href="/questions" className={styles.editLink}>
          問題を編集
        </Link>
      </div>
      <p className={styles.subtitle}>挑戦したいカテゴリーを選んでください</p>

      {/* カテゴリーが1件もない場合と、ある場合で表示を出し分ける */}
      {categories.length===0 ?(
        <p className={styles.emptyState}>
          まだカテゴリーが登録されていません。
        </p>
      ) : (
        <ul className={styles.categoryList}>
          {/* categories配列の中身を1件ずつ<li>として展開する */}
          {categories.map((category)=>(
            // key属性はReactが「どの要素がどれか」を区別するために必須
            <li key={category.id}>
              {/* クリックすると /quiz/カテゴリーID のページへ遷移する */}
              <Link
                href={`/quiz/${category.id}`}
                className={styles.categoryCard}>
                <span className={styles.categoryName}>{category.name}</span>
                <span className={styles.categoryCount}>
                  全{category._count.questions}問
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}