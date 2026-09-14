"use client";

// useStateは「画面の状態(今何問目か、など)を覚えておく」ためのReactの仕組み
import { useState } from "react";
import styles from "./quiz.module.css";

// このコンポーネントが受け取るデータの型を定義しておく
// page.tsxから渡されるquestionsの中身の形と一致させる
type Choice = {
  id: number;
  choiceText: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  questionText: string;
  explanation: string | null;
  choices: Choice[];
};

type Props = {
  categoryName: string;
  questions: Question[];
};

export function QuizClient({ categoryName, questions }: Props) {
  // 今何問目を表示しているか(0から始まる添字)
  const [currentIndex, setCurrentIndex] = useState(0);

  // ユーザーが選んだ選択肢のID(まだ選んでいなければnull)
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(
    null
  );

  // これまで正解した数
  const [correctCount, setCorrectCount] = useState(0);

  // 全問終わったかどうか
  const [finished, setFinished] = useState(false);

  // 今表示している問題
  const currentQuestion = questions[currentIndex];

  // 選択肢がクリックされたときの処理
  function handleSelectChoice(choice: Choice) {
    // すでに回答済みなら、二重に押せないようにする
    if (selectedChoiceId !== null) return;

    setSelectedChoiceId(choice.id);

    // 選んだ選択肢が正解なら、正解数を1増やす
    if (choice.isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
  }

  // 「次の問題へ」ボタンが押されたときの処理
  function handleNext() {
    const isLastQuestion = currentIndex === questions.length - 1;

    if (isLastQuestion) {
      // 最後の問題だったら、結果画面に切り替える
      setFinished(true);
    } else {
      // 次の問題に進み、選択状態をリセットする
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoiceId(null);
    }
  }

  // 全問終わった後は、結果画面を表示する
  if (finished) {
    const total = questions.length;
    const rate = Math.round((correctCount / total) * 100);

    return (
      <main className={styles.main}>
        <h1 className={styles.title}>結果</h1>
        <p className={styles.resultRate}>{rate}%</p>
        <p className={styles.resultDetail}>
          {categoryName} ・ {total}問中 {correctCount}問正解
        </p>
      </main>
    );
  }

  // 選んだ選択肢のオブジェクトを取得しておく(正誤表示のために使う)
  const selectedChoice = currentQuestion.choices.find(
    (c) => c.id === selectedChoiceId
  );

  return (
    <main className={styles.main}>
      {/* 進捗表示: 「1 / 3問」のような表示 */}
      <p className={styles.progress}>
        {categoryName} ・ {currentIndex + 1} / {questions.length}問
      </p>

      <h2 className={styles.questionText}>{currentQuestion.questionText}</h2>

      <div className={styles.choiceList}>
        {currentQuestion.choices.map((choice) => {
          // 回答済みかどうかで、ボタンの見た目を変える
          const isAnswered = selectedChoiceId !== null;
          const isSelected = choice.id === selectedChoiceId;

          // クラス名を条件によって組み立てる
          let className = styles.choiceButton;
          if (isAnswered && choice.isCorrect) {
            // 正解の選択肢は、回答後は常に緑で示す
            className += " " + styles.correct;
          } else if (isAnswered && isSelected && !choice.isCorrect) {
            // 自分が選んだ不正解の選択肢は赤で示す
            className += " " + styles.incorrect;
          }

          return (
            <button
              key={choice.id}
              className={className}
              onClick={() => handleSelectChoice(choice)}
              disabled={isAnswered}
            >
              {choice.choiceText}
            </button>
          );
        })}
      </div>

      {/* 回答した後だけ、正誤・解説・次へボタンを表示する */}
      {selectedChoice && (
        <div className={styles.feedback}>
          <p className={styles.verdict}>
            {selectedChoice.isCorrect ? "正解です" : "不正解です"}
          </p>
          {currentQuestion.explanation && (
            <p className={styles.explanation}>
              {currentQuestion.explanation}
            </p>
          )}
          <button className={styles.nextButton} onClick={handleNext}>
            {currentIndex === questions.length - 1
              ? "結果を見る"
              : "次の問題へ"}
          </button>
        </div>
      )}
    </main>
  );
}