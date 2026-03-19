import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // التأكد من أن الطلب POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { letter, usedIds = [], difficulty = 'medium' } = req.body;

  try {
    // 1. تحديد مسار الملف بدقة (يبحث في src أو في المجلد الرئيسي)
    let csvPath = path.join(process.cwd(), 'src', 'questions_with_difficulty.csv');
    if (!fs.existsSync(csvPath)) {
        csvPath = path.join(process.cwd(), 'questions_with_difficulty.csv');
    }

    // 2. قراءة الملف
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    
    // 3. فصل السطور بقوة (يدعم ويندوز ولينكس \r\n و \n)
    const lines = fileContent.split(/\r?\n/);
    let allQuestions = [];

    // 4. تحليل البيانات بأبسط وأقوى طريقة
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // التقسيم المباشر بالفواصل
        const parts = line.split(',');

        // التأكد إن السطر فيه 4 أقسام (حرف، سؤال، إجابة، صعوبة)
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

    // 5. تصفية الأسئلة بناءً على الحرف واستبعاد المستخدم
    let availableQuestions = allQuestions.filter(q => 
        q.letter === letter && !usedIds.includes(q.id)
    );

    // 6. فلترة بالصعوبة
    if (difficulty !== 'mixed') {
        let diffFiltered = availableQuestions.filter(q => q.difficulty === difficulty);
        if (diffFiltered.length > 0) {
            availableQuestions = diffFiltered;
        }
    }

    // 7. التحقق من وجود أسئلة
    if (availableQuestions.length === 0) {
        return res.status(200).json({
            question: `لا توجد أسئلة متاحة لحرف (${letter}) في هذا المستوى!`,
            answer: "تخطي",
            id: null
        });
    }

    // 8. اختيار سؤال عشوائي
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    // 9. إرسال السؤال للواجهة
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