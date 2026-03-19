import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { letter, usedIds = [], difficulty = 'medium' } = req.body;

  try {
    // 🌟 التعديل السحري هنا: المسار صار داخل مجلد api
    const csvPath = path.join(process.cwd(), 'api', 'questions_with_difficulty.csv');

    if (!fs.existsSync(csvPath)) {
        return res.status(200).json({
            question: 'خطأ: لم يتم العثور على ملف الأسئلة في الخادم! تأكد من نقله لمجلد api.',
            answer: 'خطأ',
            id: null
        });
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split(/\r?\n/);
    let allQuestions = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length >= 4) {
            allQuestions.push({
                letter: parts[0].replace(/"/g, '').trim(),
                question: parts[1].replace(/"/g, '').trim(),
                answer: parts[2].replace(/"/g, '').trim(),
                difficulty: parts[3].replace(/"/g, '').trim(),
                id: `q_${i}`
            });
        }
    }

    let availableQuestions = allQuestions.filter(q => 
        q.letter === letter && !usedIds.includes(q.id)
    );

    if (difficulty !== 'mixed') {
        let diffFiltered = availableQuestions.filter(q => q.difficulty === difficulty);
        if (diffFiltered.length > 0) {
            availableQuestions = diffFiltered;
        }
    }

    if (availableQuestions.length === 0) {
        return res.status(200).json({
            question: `لا توجد أسئلة متاحة لحرف (${letter}) في هذا المستوى!`,
            answer: "تخطي",
            id: null
        });
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    res.status(200).json({
        question: selectedQuestion.question || 'خطأ: السؤال فارغ',
        answer: selectedQuestion.answer || 'خطأ: الإجابة فارغة',
        id: selectedQuestion.id
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
        question: `خطأ في قراءة قاعدة البيانات: ${error.message}`, 
        answer: 'خطأ',
        id: null
    });
  }
}