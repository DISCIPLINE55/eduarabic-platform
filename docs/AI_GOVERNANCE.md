# EduArabic – AI Governance Policy

## Guiding Principle
> "AI is a tool for the teacher, not a replacement."

Teacher authority is final on all academic decisions. AI may suggest; only a human teacher may publish.

## What AI Can Do

| Feature | AI Role | Teacher Requirement |
|---------|---------|---------------------|
| Question Generation | Generate MCQ, T/F, fill-blank, matching, short answer | Review + edit before adding to assessment |
| Lesson Content | Draft lesson text and learning objectives | Review + edit before publishing |
| Audio Transcription | Transcribe Quran recitation via Whisper | Not required (informational only) |
| Tajweed Analysis | Flag potential rule violations (Madd, Ghunnah, Shaddah, Sukoon) | Accept / Modify / Reject each suggestion |
| Grade Suggestions | Suggest scores for subjective answers | Must manually confirm or override |

## What AI Cannot Do

- Publish assessment results to students
- Modify student records without teacher approval
- Override a teacher's manual grade
- Send announcements or notifications autonomously
- Access student personal information (PII)

## Tajweed AI Review Workflow

```
Student uploads audio recitation
         ↓
Whisper transcribes → AI analyzes Tajweed rules
         ↓
AI Suggestions stored in audio_submissions.ai_tajweed_suggestions
         ↓
Teacher opens Audio Review queue
         ↓
Teacher listens + reviews each AI suggestion:
  [Accept] → logged as accepted in teacher_decisions
  [Modify] → teacher edits the suggestion text → logged as modified
  [Reject] → suggestion dismissed → logged as rejected
         ↓
Teacher adds text/voice feedback + assigns score
         ↓
Teacher publishes → student receives feedback + score
```

## Question Generation Workflow

```
Teacher opens AI Question Generation
         ↓
Teacher provides: subject, topic, level, count, question types
         ↓
Edge Function calls Gemini with structured prompt
         ↓
Questions returned with: text, options, correct_answer, explanation
         ↓
Teacher reviews in Preview UI:
  - Edit question text
  - Change correct answer
  - Delete unwanted questions
  - Add manual questions
         ↓
Teacher confirms → questions added to Question Bank
         ↓
Assessment published only by explicit teacher action
```

## Data Stored for AI Accountability

```jsonb
// audio_submissions.ai_tajweed_suggestions
[
  {
    "rule": "Madd",
    "ayah": 3,
    "note": "Elongation appears insufficient at position 2:7",
    "confidence": 0.87
  }
]

// audio_submissions.teacher_decisions
[
  {
    "rule": "Madd",
    "note": "Teacher confirmed: student needs to extend madd by 1 count",
    "accepted": true
  }
]
```

## Prohibited AI Practices
1. Never send student names, IDs, or contact info to external AI APIs
2. Never auto-publish any AI-generated content to students
3. Never allow AI to modify `score`, `status`, or `feedback` fields directly
4. Never use AI suggestions to override a teacher's explicit manual decision
5. All AI API calls must go through Edge Functions — never from client code

## Future AI Features (Roadmap)
- Personalized learning path suggestions (teacher-approved before activation)
- Attendance anomaly detection alerts
- Predictive Hifz completion estimates
- Natural language report generation for parents
