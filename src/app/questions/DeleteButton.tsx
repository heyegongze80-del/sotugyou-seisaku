// window.confirmやonClickなど、ブラウザ上でしか使えない機能を使うため
// クライアントコンポーネントにする必要がある
"use client";

// useStateを使う理由: 削除処理中はボタンを連打できないようにするため
import { useState } from "react";
// deleteQuestionは"use server"付きのServer Action。
// クライアント側からは普通の関数のように呼べるが、実行はサーバー側で行われる
import { deleteQuestion } from "./actions";
import styles from "./questions.module.css";

// 1つの設問を消すのに必要な情報はidだけなので、questionIdの1項目に絞っている
type Props = {
  questionId: number;
};

export function DeleteButton({ questionId }: Props) {
  // 削除リクエストを送信中かどうかを覚えておくState
  // trueの間はボタンをdisabledにして、連打による二重削除を防ぐ
  const [deleting, setDeleting] = useState(false);

  // 削除ボタンが押されたときの処理
  async function handleClick() {
    // 誤操作防止のため、確認ダイアログを出す
    // (JavaScript基礎で習ったwindow.confirmと同じ、ブラウザ標準の機能)
    const confirmed = window.confirm("この問題を削除しますか?");
    // キャンセルされた場合はここで処理を止める(deletingもtrueにしない)
    if (!confirmed) return;

    setDeleting(true);
    try {
      // 実際の削除(DBへの書き込み)はサーバー側で行われる
      await deleteQuestion(questionId);
    } finally {
      // 成功しても、途中でエラーが起きても、必ずボタンを元の状態に戻す
      // catchを書いていないため、失敗時はコンソールにエラーが出るだけで
      // 画面上にエラーメッセージは表示されない(現状の作りの限界)
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      // 削除中は押せないようにして、二重送信を防ぐ
      disabled={deleting}
      className={styles.deleteButton}
    >
      {/* 削除中かどうかで表示文言を切り替え、処理中であることが伝わるようにする */}
      {deleting ? "削除中..." : "削除"}
    </button>
  );
}