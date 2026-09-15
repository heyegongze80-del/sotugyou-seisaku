// ボタンのクリックや入力に反応する必要があるので、クライアントコンポーネントにする
"use client";

// useStateはReactの基本フック。値を「覚えておく」ために使う
import { useState } from "react";
// 先ほどのサーバー側の関数を読み込む
import { createQuestion } from "./actions";
// このページ専用のCSSファイルを読み込む
import styles from "./questionForm.module.css";

// フォーム全体の入力値の形を定義する型
type FormValues = {
  category: string;
  question: string;
  choices: string[]; // 4つの選択肢
  correctIndex: number | null; // まだ選ばれていない場合はnull
  explanation: string;
};

// エラーメッセージの形を定義する型
// 各項目名に対して、あれば文字列(エラー文)、なければ何も入らない(?)
type FormErrors = {
  category?: string;
  question?: string;
  choices?: string;
  correctIndex?: string;
};

export function QuestionForm() {
  // フォームの入力値を1つのStateオブジェクトとしてまとめて管理する
  const [values, setValues] = useState<FormValues>({
    category: "",
    question: "",
    choices: ["", "", "", ""],
    correctIndex: null,
    explanation: "",
  });

  // エラーメッセージ用のState(最初は何もエラーがない状態)
  const [errors, setErrors] = useState<FormErrors>({});

  // 送信処理が実行中かどうかを覚えておくState(二重送信を防ぐため)
  const [submitting, setSubmitting] = useState(false);

  // カテゴリー・問題文・解説文の入力欄で共通して使うハンドラー
  // input要素のname属性を見て、Stateの該当するキーだけを書き換える
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev, // 他の項目はそのままコピー
      [name]: value, // name属性と同じ名前のキーだけ書き換える(算出プロパティ名)
    }));
  };

  // 4択のうち、指定した1つだけを書き換えるためのハンドラー
  const handleChoiceChange = (index: number, value: string) => {
    setValues((prev) => {
      // 配列を直接書き換えず、いったんコピーを作る(Stateの配列は直接変更してはいけないルール)
      const nextChoices = [...prev.choices];
      nextChoices[index] = value;
      return { ...prev, choices: nextChoices };
    });
  };

  // ラジオボタンで正解を選んだときのハンドラー
  const handleCorrectChange = (index: number) => {
    setValues((prev) => ({ ...prev, correctIndex: index }));
  };

  // 送信前に入力内容をチェックする関数
  // 問題があれば、その項目名をキーにしたエラーメッセージを集めて返す
  const validate = (data: FormValues): FormErrors => {
    const newErrors: FormErrors = {};
    if (!data.category) {
      newErrors.category = "カテゴリーは必須入力です";
    }
    if (!data.question) {
      newErrors.question = "問題文は必須入力です";
    }
    if (data.choices.some((c) => !c)) {
      newErrors.choices = "選択肢は4つとも入力してください";
    }
    if (data.correctIndex === null) {
      newErrors.correctIndex = "正解を選択してください";
    }
    return newErrors;
  };

  // フォームが送信されたときの処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // フォームのデフォルトの送信動作(ページ全体が再読み込みされる)をキャンセルする
    e.preventDefault();

    // 入力内容をチェックし、結果をStateに反映する
    const validationErrors = validate(values);
    setErrors(validationErrors);

    // エラーが1つでもあれば、ここで処理を止めて送信しない
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // 送信中フラグを立てて、ボタンを押せなくする
    setSubmitting(true);
    try {
      // サーバー側の関数を、普通の関数呼び出しとして実行する
      await createQuestion({
        category: values.category,
        question: values.question,
        choices: values.choices,
        correctIndex: values.correctIndex as number, // ここまで来ればnullではないと分かっている
        explanation: values.explanation,
      });
    } finally {
      // 成功しても失敗しても、最後に送信中フラグを戻す
      setSubmitting(false);
    }
  };

  return (
    // noValidateでブラウザ標準の検証を無効化し、自作のvalidate関数だけに任せる
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>カテゴリー</label>
        <input
          type="text"
          name="category"
          value={values.category}
          onChange={handleChange}
          placeholder="例:地理、歴史、スポーツ など"
          className={styles.input}
        />
        {/* エラーがなければ空文字が表示されるだけなので、常にこの位置に置いてよい */}
        <div className={styles.error}>{errors.category}</div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>問題文</label>
        <textarea
          name="question"
          value={values.question}
          onChange={handleChange}
          placeholder="問題文を入力"
          className={styles.textarea}
        />
        <div className={styles.error}>{errors.question}</div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          選択肢(左のボタンで正解を選択)
        </label>

        {/* 配列を繰り返し処理して、ラジオボタン+テキスト入力のペアを4つ表示する */}
        {values.choices.map((choiceText, index) => (
          <div key={index} className={styles.choiceRow}>
            <input
              type="radio"
              name="correct"
              checked={values.correctIndex === index}
              onChange={() => handleCorrectChange(index)}
            />
            <input
              type="text"
              value={choiceText}
              onChange={(e) => handleChoiceChange(index, e.target.value)}
              placeholder={`選択肢 ${index + 1}`}
              className={styles.input}
            />
          </div>
        ))}
        {/* choicesのエラーとcorrectIndexのエラーを1箇所にまとめて表示する */}
        <div className={styles.error}>
          {errors.choices || errors.correctIndex}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>解説文(任意)</label>
        <textarea
          name="explanation"
          value={values.explanation}
          onChange={handleChange}
          placeholder="正解の理由などを入力"
          className={styles.textarea}
        />
      </div>

      {/* 送信中(submitting)はボタンを無効化し、二重送信を防ぐ */}
      <button
        type="submit"
        disabled={submitting}
        className={styles.submitButton}
      >
        {submitting ? "登録中..." : "問題を追加"}
      </button>
    </form>
  );
}