"use strict";

// ========================================
// ASSIGNMENT 12 - QUIZ MASTER APP
// ES6 + OOP + API + TIMER + SOUND
// ========================================

class QuizApp {
  constructor() {
    // Game Data
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.timeLeft = 15;
    this.timer = null;
    this.answered = false;
    this.audioContext = null;

    // Screens
    this.screens = document.querySelectorAll(".screen");

    // Form
    this.form = document.getElementById("quiz-form");
    this.category = document.getElementById("category");
    this.difficulty = document.getElementById("difficulty");
    this.amount = document.getElementById("amount");
    this.questionType = document.getElementById("question-type");

    // Quiz Elements
    this.questionCounter = document.getElementById("question-counter");
    this.scoreDisplay = document.getElementById("score-display");
    this.timerDisplay = document.getElementById("timer-display");
    this.progressBar = document.getElementById("progress-bar");
    this.timerBar = document.getElementById("timer-bar");
    this.questionCategory = document.getElementById("question-category");
    this.questionText = document.getElementById("question-text");
    this.answersContainer = document.getElementById("answers-container");
    this.nextBtn = document.getElementById("next-btn");

    // Result Elements
    this.resultIcon = document.getElementById("result-icon");
    this.finalScore = document.getElementById("final-score");
    this.totalQuestions = document.getElementById("total-questions");
    this.resultPercentage = document.getElementById("result-percentage");
    this.resultMessage = document.getElementById("result-message");
    this.correctCount = document.getElementById("correct-count");
    this.wrongCount = document.getElementById("wrong-count");
    this.restartBtn = document.getElementById("restart-btn");

    // Events
    this.addEvents();
  }

  // =====================================
  // EVENTS
  // =====================================

  addEvents() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.startGame();
    });

    this.nextBtn.addEventListener("click", () => {
      this.nextQuestion();
    });

    this.restartBtn.addEventListener("click", () => {
      this.restartGame();
    });

    document.addEventListener("keydown", (event) => {
      this.handleKeyboard(event);
    });
  }

  // =====================================
  // SCREEN MANAGEMENT
  // =====================================

  showScreen(screenId) {
    this.screens.forEach((screen) => {
      screen.classList.remove("active");
    });

    document.getElementById(screenId).classList.add("active");
  }

  // =====================================
  // FETCH QUESTIONS FROM API
  // =====================================

  async startGame() {
    this.stopTimer();

    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.answered = false;

    this.showScreen("loading-screen");

    const amount = this.amount.value;
    const category = this.category.value;
    const difficulty = this.difficulty.value;
    const type = this.questionType.value;

    const params = new URLSearchParams({
      amount: amount,
      category: category,
      difficulty: difficulty
    });

    if (type) {
      params.append("type", type);
    }

    const apiURL =
      https://opentdb.com/api.php?${params.toString()};

    try {
      const response = await fetch(apiURL);

      if (!response.ok) {
        throw new Error("Failed to connect to API");
      }

      const data = await response.json();

      if (data.response_code !== 0 || !data.results?.length) {
        if (data.response_code === 5) {
          throw new Error("Too many requests. Please wait a few seconds.");
        }

        throw new Error(
          "No questions available for these settings. Try another category or difficulty."
        );
      }
      this.questions = data.results.map((question) => {
        return {
          category: question.category,
          difficulty: question.difficulty,
          type: question.type,
          question: this.decodeHTML(question.question),
          correctAnswer: this.decodeHTML(question.correct_answer),
          answers: this.shuffleAnswers([
            ...question.incorrect_answers.map((answer) =>
              this.decodeHTML(answer)
            ),
            this.decodeHTML(question.correct_answer)
          ])
        };
      });

      this.showScreen("quiz-screen");
      this.showQuestion();

    } catch (error) {
      console.error("Quiz API Error:", error);

      alert(error.message);

      this.showScreen("start-screen");
    }
  }

  // =====================================
  // DECODE HTML ENTITIES
  // =====================================

  decodeHTML(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  // =====================================
  // SHUFFLE ANSWERS
  // =====================================

  shuffleAnswers(answers) {
    const shuffled = [...answers];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(
        Math.random() * (i + 1)
      );

      [shuffled[i], shuffled[randomIndex]] =
        [shuffled[randomIndex], shuffled[i]];
    }

    return shuffled;
  }

  // =====================================
  // SHOW CURRENT QUESTION
  // =====================================

  showQuestion() {
    this.stopTimer();

    this.answered = false;
    this.timeLeft = 15;

    const currentQuestion = this.questions[this.currentIndex];

    if (!currentQuestion) {
      this.showResults();
      return;
    }

    // Question Number
    this.questionCounter.textContent =
      Question ${this.currentIndex + 1} of ${this.questions.length};

    // Score
    this.scoreDisplay.textContent =
      Score: ${this.score};

    // Progress Bar
    const progress =
      (this.currentIndex / this.questions.length) * 100;

    this.progressBar.style.width = ${progress}%;

    // Question Information
    this.questionCategory.textContent =
      currentQuestion.category;

    this.questionText.textContent =
      currentQuestion.question;

    // Reset Answers
    this.answersContainer.innerHTML = "";

    // Create Answer Buttons
    currentQuestion.answers.forEach((answer, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "answer-btn";

      const number = document.createElement("span");
      number.className = "answer-number";
      number.textContent = index + 1;

      const answerText = document.createElement("span");
      answerText.textContent = answer;

      button.append(number, answerText);

      button.addEventListener("click", () => {
        this.selectAnswer(index);
      });

      this.answersContainer.appendChild(button);
    });

    // Reset Next Button
    this.nextBtn.disabled = true;

    this.nextBtn.textContent =
      this.currentIndex === this.questions.length - 1
        ? "Show Results →"
        : "Next Question →";

    // Start Timer
    this.updateTimerUI();
    this.startTimer();
  }

  // =====================================
  // TIMER - 15 SECONDS
  // =====================================

  startTimer() {
    this.stopTimer();

    this.timer = setInterval(() => {
      this.timeLeft--;

      this.updateTimerUI();

      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.stopTimer();
        this.timeOut();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateTimerUI() {
    this.timerDisplay.textContent =
      ⏱ ${this.timeLeft}s;

    const percentage = (this.timeLeft / 15) * 100;

    this.timerBar.style.width = ${percentage}%;
    } catch (error) {
      console.warn("Audio unavailable:", error);
    }
  }

  // =====================================
  // NEXT QUESTION
  // =====================================

  nextQuestion() {
    if (!this.answered) return;

    this.stopTimer();

    this.currentIndex++;

    if (this.currentIndex < this.questions.length) {
      this.showQuestion();
    } else {
      this.showResults();
    }
  }

  // =====================================
  // FINAL RESULTS
  // =====================================

  showResults() {
    this.stopTimer();

    const total = this.questions.length;
    const correct = this.score;
    const wrong = total - correct;

    const percentage =
      total > 0
        ? Math.round((correct / total) * 100)
        : 0;

    this.finalScore.textContent = correct;
    this.totalQuestions.textContent = / ${total};

    this.resultPercentage.textContent =
      ${percentage}% Correct Answers;

    this.correctCount.textContent = correct;
    this.wrongCount.textContent = wrong;

    if (percentage >= 80) {
      this.resultIcon.textContent = "🏆";
      this.resultMessage.textContent =
        "Outstanding! You are a true Quiz Master!";

    } else if (percentage >= 50) {
      this.resultIcon.textContent = "🌟";
      this.resultMessage.textContent =
        "Great job! Keep practicing to become even better!";

    } else {
      this.resultIcon.textContent = "💪";
      this.resultMessage.textContent =
        "Keep learning! Every attempt makes you stronger!";
    }

    this.progressBar.style.width = "100%";

    this.showScreen("result-screen");
  }

  // =====================================
  // RESTART GAME
  // =====================================

  restartGame() {
    this.stopTimer();

    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.timeLeft = 15;
    this.answered = false;

    this.showScreen("start-screen");
  }
}

// ========================================
// CREATE OBJECT FROM CLASS
// ========================================

const quizApp = new QuizApp();