import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // نستقبل الحرف، الأسئلة المستخدمة، ومستوى الصعوبة من الواجهة
  const { letter, usedIds = [], difficulty = 'medium' } = req.body;

  try {
    const csvPath = path.join(process.cwd(), 'api', 'questions_with_difficulty.csv');

    if (!fs.existsSync(csvPath)) {
        return res.status(200).json({ question: 'لم يتم العثور على قاعدة البيانات', answer: 'خطأ', id: null });
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split(/\r?\n/);
    let allQuestions = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 4) {
            let cleanLetter = parts[0].replace(/"/g, '').replace(/^\uFEFF/, '').trim();
            allQuestions.push({
                letter: cleanLetter,
                question: parts[1].replace(/"/g, '').trim(),
                answer: parts[2].replace(/"/g, '').trim(),
                difficulty: parts[3].replace(/"/g, '').trim(),
                id: `q_${i}`
            });
        }
    }

    // 🔥 هنا الحل الجذري: تحويل الصعوبة من إنجليزي لعربي عشان تطابق ملفك
    const diffMap = { 'easy': 'سهل', 'medium': 'متوسط', 'hard': 'صعب', 'mixed': 'mixed' };
    const targetDiff = diffMap[difficulty] || 'متوسط';

    const searchLetter = letter.trim();
    
    // فلترة بالحرف
    let availableQuestions = allQuestions.filter(q => 
        q.letter === searchLetter && !usedIds.includes(q.id)
    );

    // فلترة بالصعوبة
    if (difficulty !== 'mixed') {
        let diffFiltered = availableQuestions.filter(q => q.difficulty === targetDiff);
        if (diffFiltered.length > 0) availableQuestions = diffFiltered;
    }

    if (availableQuestions.length === 0) {
        return res.status(200).json({
            question: `لا توجد أسئلة لحرف (${letter}) بصعوبة (${targetDiff})`,
            answer: "تخطي",
            id: null
        });
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    res.status(200).json({
        question: selectedQuestion.question,
        answer: selectedQuestion.answer,
        id: selectedQuestion.id
    });

  } catch (error) {
    res.status(500).json({ question: `خطأ في الخادم: ${error.message}`, answer: 'خطأ', id: null });
  }
}