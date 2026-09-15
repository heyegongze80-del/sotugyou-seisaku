"use client";

// useEffectを追加:「画面表示時に自動で1回だけ実行したい処理」のために使う
import { useEffect, useState } from "react";
import styles from "./quiz.module.css";
// 先ほど作った3つのサーバー側関数を読み込む
import {
  startQuizAttempt,
  recordQuizAnswer,
  finishQuizAttempt,
} from "./actions";

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
  categoryId: number; // 追加:挑戦履歴作成に必要
  categoryName: string;
  questions: Question[];
};

export function QuizClient({ categoryId, categoryName, questions }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(
    null
  );
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // 追加:今回の挑戦履歴(quiz_attempts)のidを覚えておくState
  // まだDBに作られていない間はnull
  const [attemptId, setAttemptId] = useState<number | null>(null);

  // 追加:画面が最初に表示されたタイミングで、1回だけ挑戦履歴を作る
  // 依存配列を空配列[]にしているのは「最初の1回だけ実行したい」という意図を示すため
  // (React基本フックの章で習った、useEffectの基本パターンそのもの)
  useEffect(() => {
    startQuizAttempt(categoryId, questions.length).then((id) => {
      setAttemptId(id);
    });
  }, [categoryId, questions.length]);

  const currentQuestion = questions[currentIndex];

  // 選択肢がクリックされたときの処理
  // DBへの書き込み(await)を行うため、asyncを付ける
  async function handleSelectChoice(choice: Choice) {
    if (selectedChoiceId !== null) return;

    setSelectedChoiceId(choice.id);

    if (choice.isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    // attemptIdがまだ用意できていない場合(通信中など)は記録をスキップする
    // (万が一のタイミングのずれに備えた安全策)
    if (attemptId !== null) {
      await recordQuizAnswer({
        attemptId,
        questionId: currentQuestion.id,
        choiceId: choice.id,
        isCorrect: choice.isCorrect,
      });
    }
  }

  // 「次の問題へ」ボタンが押されたときの処理
  async function handleNext() {
    const isLastQuestion = currentIndex === questions.length - 1;

    if (isLastQuestion) {
      // 最後の問題だったら、挑戦履歴を確定させてから結果画面に切り替える
      if (attemptId !== null) {
        await finishQuizAttempt(attemptId, correctCount);
      }
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoiceId(null);
    }
  }

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

  const selectedChoice = currentQuestion.choices.find(
    (c) => c.id === selectedChoiceId
  );

  return (
    <main className={styles.main}>
      <p className={styles.progress}>
        {categoryName} ・ {currentIndex + 1} / {questions.length}問
      </p>

      <h2 className={styles.questionText}>{currentQuestion.questionText}</h2>

      <div className={styles.choiceList}>
        {currentQuestion.choices.map((choice) => {
          const isAnswered = selectedChoiceId !== null;
          const isSelected = choice.id === selectedChoiceId;

          let className = styles.choiceButton;
          if (isAnswered && choice.isCorrect) {
            className += " " + styles.correct;
          } else if (isAnswered && isSelected && !choice.isCorrect) {
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