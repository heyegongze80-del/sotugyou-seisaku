import { QuestionForm } from "./QuestionForm";
import styles from "./questionForm.module.css";

export default function NewQuestionPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>問題を作成</h1>
      <QuestionForm />
    </main>
  );
}