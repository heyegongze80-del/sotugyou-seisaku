"use client";

// useStateを使う理由: 削除処理中はボタンを連打できないようにするため
import { useState } from "react";
import { deleteQuestion } from "./actions";
import styles from "./questions.module.css";

type Props = {
  questionId: number;
};

export function DeleteButton({ questionId }: Props) {
  const [deleting, setDeleting] = useState(false);

  // 削除ボタンが押されたときの処理
  async function handleClick() {
    // 誤操作防止のため、確認ダイアログを出す
    // (JavaScript基礎で習ったwindow.confirmと同じ、ブラウザ標準の機能)
    const confirmed = window.confirm("この問題を削除しますか?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteQuestion(questionId);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={deleting}
      className={styles.deleteButton}
    >
      {deleting ? "削除中..." : "削除"}
    </button>
  );
}