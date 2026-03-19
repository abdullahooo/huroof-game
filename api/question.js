import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    // إعدادات السماح للواجهة تتصل بالـ API بدون مشاكل CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { letter, usedIds = [], difficulty = 'mixed' } = req.body;
    
    let allQuestions = [];
    // قراءة الملف من المجلد الرئيسي للمشروع
    const filePath = path.join(process.cwd(), 'questions_with_difficulty.csv');

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 4) {
                allQuestions.push({
                    id: i,
                    letter: parts[0].trim(),
                    question: parts[1].trim(),
                    answer: parts[2].trim(),
                    difficulty: parts[3].trim()
                });
            }
        }
    } else {
        return res.status(500).json({ error: "❌ ملف الأسئلة غير موجود!" });
    }

    // الفلترة
    let filtered = allQuestions.filter(q => q.letter === letter && !usedIds.includes(q.id));

    if (difficulty !== 'mixed') {
        const diffMap = {
            'easy': 'سهل',
            'medium': 'متوسط',
            'hard': 'صعب'
        };
        const targetDiff = diffMap[difficulty];
        const diffFiltered = filtered.filter(q => q.difficulty === targetDiff);
        
        if (diffFiltered.length > 0) {
            filtered = diffFiltered;
        }
    }

    if (filtered.length === 0) {
        return res.status(200).json({ 
            id: null,
            question: `انتهت جميع الأسئلة المتاحة لحرف (${letter}).`, 
            answer: 'انتهى' 
        });
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    res.status(200).json(filtered[randomIndex]);
}