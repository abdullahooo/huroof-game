import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // التأكد من أن الطلب POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { letter, usedIds = [], difficulty = 'medium' } = req.body;

  try {
    // 1. تحديد مسار ملف الأسئلة (نبحث في src ثم في المجلد الرئيسي)
    let csvPath = path.join(process.cwd(), 'src', 'questions_with_difficulty.csv');
    if (!fs.existsSync(csvPath)) {
        csvPath = path.join(process.cwd(), 'questions_with_difficulty.csv');
    }

    // 2. قراءة الملف
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n');
    let allQuestions = [];

    // 3. تحليل الـ CSV (تخطي السطر الأول إذا كان عناوين)
    // ⚠️ ملاحظة مهمة: تأكد من ترتيب الأعمدة في ملفك، هنا افترضنا التالي:
    // 0: الحرف | 1: السؤال | 2: الإجابة | 3: الصعوبة | 4: الآيدي
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // تقسيم السطر لفصل الأعمدة (يدعم الفواصل داخل النصوص المقتبسة)
        const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || line.split(',');
        
        if (columns.length >= 4) {
            const cleanCols = columns.map(c => c.replace(/^"|"$/g, '').trim());
            allQuestions.push({
                letter: cleanCols[0],      // العمود الأول: الحرف
                question: cleanCols[1],    // العمود الثاني: السؤال
                answer: cleanCols[2],      // العمود الثالث: الإجابة
                difficulty: cleanCols[3],  // العمود الرابع: الصعوبة
                id: cleanCols[4] || `q_${i}` // العمود الخامس: ID (أو رقم السطر)
            });
        }
    }

    // 4. تصفية الأسئلة بناءً على الحرف واستبعاد الأسئلة المستخدمة
    let availableQuestions = allQuestions.filter(q => 
        q.letter === letter && !usedIds.includes(q.id)
    );

    // 5. فلترة بالصعوبة (إذا لم يكن "مشكل")
    if (difficulty !== 'mixed') {
        let diffFiltered = availableQuestions.filter(q => q.difficulty === difficulty);
        // إذا كان فيه أسئلة بهذي الصعوبة، نستخدمها. إذا خلصت نرجع للمشكل كاحتياط
        if (diffFiltered.length > 0) {
            availableQuestions = diffFiltered;
        }
    }

    // 6. التحقق من وجود أسئلة
    if (availableQuestions.length === 0) {
        return res.status(200).json({
            question: `انتهت الأسئلة المتاحة لحرف (${letter}). اختر خلية أخرى!`,
            answer: "لا يوجد",
            id: null
        });
    }

    // 7. اختيار سؤال عشوائي
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    // 8. إرسال السؤال للواجهة
    res.status(200).json({
        question: selectedQuestion.question,
        answer: selectedQuestion.answer,
        id: selectedQuestion.id
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
        question: 'حدث خطأ أثناء قراءة ملف قاعدة البيانات من الخادم.', 
        answer: 'خطأ',
        error: error.message 
    });
  }
}