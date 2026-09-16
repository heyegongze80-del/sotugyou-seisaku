"use client";

// useEffectを追加:「画面表示時に自動で1回だけ実行したい処理」のために使う
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./quiz.module.css";
// 先ほど作った3つのサーバー側関数を読み込む
//DBを操作するサーバー側の関数("use server"が付いているファイルから読み込んでいる)
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
  //DBを操作するサーバー側の関数("use server"が付いているファイルから読み込んでいる)
  const [currentIndex, setCurrentIndex] = useState(0);
  //クリックした選択肢のid(未回答ならnull)
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(
    null
  );
  //	正解数の累計
  const [correctCount, setCorrectCount] = useState(0);
  //	結果画面に切り替えるかどうか
  const [finished, setFinished] = useState(false);

  // 今回の挑戦履歴(quiz_attempts)のidを覚えておくState
  // 	DBに作った挑戦履歴のid(未作成ならnull)
  const [attemptId, setAttemptId] = useState<number | null>(null);

  // ガード無しだと挑戦履歴(quiz_attempts)が2行作られてしまうため、
  // useRefで「もう実行したか」を覚えておき、2回目以降は何もしない
  // (useStateにしないのは、値が変わっても再描画を起こす必要が無いため)
  const hasStartedRef = useRef(false);

  // 画面が最初に表示されたタイミングで、1回だけ挑戦履歴を作る
  useEffect(() => {
    //hasStartedRef.currentがtrueなら、ここで処理を終了する
    if (hasStartedRef.current) return;
    //「もう実行した」という印を、箱の中に書き込んでル。
    hasStartedRef.current = true;

    //Promiseの中身の準備ができたら、この関数を実行して
    startQuizAttempt(categoryId, questions.length).then((id) => {
      //受け取ったidを、Stateに保存しています。これで画面(コンポーネント)側からattemptIdが使えるようになります。
      setAttemptId(id);
    });
  }, [categoryId, questions.length]);

  //配列は[番号]で中身を取り出せます。currentIndexが0なら1問目のデータが入ります。
  const currentQuestion = questions[currentIndex];

  // 選択肢がクリックされたときの処理
  // DBへの書き込み(await)を行うため、asyncを付ける
  //もう回答済みなら何もしない(連打防止)
  async function handleSelectChoice(choice: Choice) {
    if (selectedChoiceId !== null) return;

    //クリックされた選択肢のidをStateに記録
    setSelectedChoiceId(choice.id);
    
    //正解なら正解数を1増やす
    if (choice.isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    // attemptIdがまだ用意できていない場合(通信中など)は記録をスキップする
    // (万が一のタイミングのずれに備えた安全策)
    //attemptIdが用意できていれば、DBに「この問題にこの選択肢で回答した」という記録を1行追加する
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
    //今の番号が、最後の問題の番号と同じか判定
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
    //正答率を計算
    const rate = Math.round((correctCount / total) * 100);

    return (
      <main className={styles.main}>
        <h1 className={styles.title}>結果</h1>
        <p className={styles.resultRate}>{rate}%</p>
        <p className={styles.resultDetail}>
          {categoryName} ・ {total}問中 {correctCount}問正解
        </p>
        {/* Linkを使うと画面全体を再読み込みせずにトップページへ遷移できる */}
        <Link href="/" className={styles.homeLink}>
          トップページへ戻る
        </Link>
      </main>
    );
  }

  //.find(条件)は「配列の中から条件に一致する最初の1つ」を探します。
  //ここでは「クリックされた選択肢そのもの」を取り出しています。何も選んでいなければundefinedになります。
  const selectedChoice = currentQuestion.choices.find(
    (c) => c.id === selectedChoiceId
  );

  return (
    <main className={styles.main}>
      <p className={styles.progress}>
        {/**currentIndexは0始まりなので、人間向けの表示は+ 1しています */}
        {categoryName} ・ {currentIndex + 1} / {questions.length}問
      </p>

      <h2 className={styles.questionText}>{currentQuestion.questionText}</h2>

      <div className={styles.choiceList}>
        {currentQuestion.choices.map((choice) => {
          const isAnswered = selectedChoiceId !== null;
          const isSelected = choice.id === selectedChoiceId;

          //let if文でclassNameの中身を書き換える(追加する)必要があるから
          let className = styles.choiceButton;
          if (isAnswered && choice.isCorrect) {
            //なぜ" "(半角スペース)を挟むのか?
            // HTMLのclass属性は、複数のクラス名を半角スペース区切りで書くルール
            className += " " + styles.correct;
            //回答済み、かつ、この選択肢が選ばれたもの、かつ、正解ではない
          } else if (isAnswered && isSelected && !choice.isCorrect) {
            className += " " + styles.incorrect;
          }

          //classNameの組み立てにif文が必要だったため、{}とreturnを使う通常の書き方にした
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


        {/**何か選択済みのときだけ表示(&&は左がtrueっぽい値のときだけ右を評価する) */}
      {selectedChoice && (
        <div className={styles.feedback}>
          <p className={styles.verdict}>
            {selectedChoice.isCorrect ? "正解です" : "不正解です"}
          </p>
          {/**解説文があるときだけ表示 */}
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