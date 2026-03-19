import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 1. تحميل الأسئلة من الملف الموحد
let allQuestions = [];
const filePath = path.join(__dirname, 'questions_with_difficulty.csv');

if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // نتخطى السطر الأول (رؤوس الأعمدة) ونقرأ الباقي
    for (let i = 1; i < lines.length; i++) {
        // تقسيم السطر بناءً على الفاصلة
        const parts = lines[i].split(',');
        if (parts.length >= 4) {
            allQuestions.push({
                id: i, // نعطي كل سؤال رقم تعريفي عشان ما يتكرر
                letter: parts[0].trim(),
                question: parts[1].trim(),
                answer: parts[2].trim(),
                difficulty: parts[3].trim() // سهل، متوسط، صعب
            });
        }
    }
    console.log(`✅ تم تحميل ${allQuestions.length} سؤال بنجاح من الملف المحدث.`);
} else {
    console.error("❌ ملف الأسئلة questions_with_difficulty.csv غير موجود في مجلد backend!");
}

// 2. استقبال طلبات اللعبة من الواجهة
app.post('/api/question', (req, res) => {
    const { letter, usedIds = [], difficulty = 'mixed' } = req.body;
    
    // فلترة مبدئية حسب الحرف والأسئلة اللي ما طلعت لللاعب من قبل
    let filtered = allQuestions.filter(q => q.letter === letter && !usedIds.includes(q.id));

    // فلترة حسب الصعوبة (إذا اللاعب ما اختار "مشكل")
    if (difficulty !== 'mixed') {
        // نترجم الكلمة اللي جاية من الواجهة للكلمة اللي بالملف
        const diffMap = {
            'easy': 'سهل',
            'medium': 'متوسط',
            'hard': 'صعب'
        };
        const targetDiff = diffMap[difficulty];
        const diffFiltered = filtered.filter(q => q.difficulty === targetDiff);
        
        // نظام ذكي: لو خلصت الأسئلة من الصعوبة المطلوبة، نعطيه من المتوفر عشان ما توقف اللعبة عليه
        if (diffFiltered.length > 0) {
            filtered = diffFiltered;
        }
    }

    // إذا خلصت كل أسئلة الحرف
    if (filtered.length === 0) {
        return res.json({ 
            id: null,
            question: `انتهت جميع الأسئلة المتاحة لحرف (${letter}).`, 
            answer: 'انتهى' 
        });
    }

    // سحب سؤال عشوائي من القائمة المفلترة
    const randomIndex = Math.floor(Math.random() * filtered.length);
    res.json(filtered[randomIndex]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال وجاهز لاستقبال التحديات على بورت ${PORT}`);
});