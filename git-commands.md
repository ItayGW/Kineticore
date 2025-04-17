# פקודות Git נפוצות - מדריך למשתמש

## התקנה ראשונית
```bash
# יצירת מאגר Git חדש בתיקייה הנוכחית
git init

# הגדרת שם המשתמש הגלובלי
git config --global user.name "Your Name"

# הגדרת כתובת האימייל הגלובלית
git config --global user.email "your.email@example.com"
```

## פקודות בסיסיות
```bash
# בדיקת מצב הקבצים במאגר
git status

# הוספת כל השינויים לשלב ההכנה
git add .

# הוספת קובץ ספציפי לשלב ההכנה
git add filename.txt

# יצירת commit עם הודעה
git commit -m "תיאור השינויים שבוצעו"

# הצגת היסטוריית ה-commits
git log
```

## עבודה עם שרת מרוחק
```bash
# הוספת מאגר מרוחק
git remote add origin https://github.com/username/repository.git

# העלאת השינויים לשרת המרוחק
git push -u origin main

# הורדת שינויים מהשרת המרוחק
git pull origin main

# שכפול מאגר קיים
git clone https://github.com/username/repository.git
```

## עבודה עם ענפים
```bash
# יצירת ענף חדש
git branch new-branch-name

# מעבר לענף אחר
git checkout branch-name

# יצירת ענף חדש ומעבר אליו
git checkout -b new-branch-name

# מיזוג ענף לתוך הענף הנוכחי
git merge branch-name
```

## פקודות מתקדמות
```bash
# ביטול שינויים בקובץ שעדיין לא נוסף לשלב ההכנה
git checkout -- filename

# ביטול שינויים שכבר נוספו לשלב ההכנה
git reset HEAD filename

# ביטול commit אחרון
git reset --soft HEAD~1

# הצגת השינויים בין commits
git diff commit1 commit2
```

## טיפים שימושיים
```bash
# שמירת שינויים זמנית
git stash

# שחזור השינויים הזמניים
git stash pop

# בדיקת ענפים קיימים
git branch -a

# מחיקת ענף
git branch -d branch-name
```

## דוגמאות לתרחישים נפוצים

### תרחיש 1: העלאת פרויקט חדש ל-GitHub
```bash
# יצירת מאגר חדש
git init

# הוספת כל הקבצים
git add .

# יצירת commit ראשוני
git commit -m "commit ראשוני"

# חיבור למאגר מרוחק
git remote add origin https://github.com/username/repository.git

# העלאת הקוד
git push -u origin main
```

### תרחיש 2: עדכון קוד קיים
```bash
# בדיקת שינויים
git status

# הוספת שינויים חדשים
git add .

# יצירת commit
git commit -m "עדכון: תיאור השינויים"

# העלאה לשרת
git push origin main
```

### תרחיש 3: עבודה על פיצ'ר חדש
```bash
# יצירת ענף חדש לפיצ'ר
git checkout -b feature/new-feature

# עבודה על הקוד והוספת שינויים
git add .
git commit -m "הוספת פיצ'ר חדש"

# מיזוג חזרה לענף הראשי
git checkout main
git merge feature/new-feature

# העלאה לשרת
git push origin main
```

## פתרון בעיות נפוצות

### בעיה 1: סתירות ב-merge
```bash
# כאשר יש סתירות, יש לפתור אותן ידנית בקבצים
# לאחר פתרון הסתירות:
git add .
git commit -m "פתרון סתירות"
```

### בעיה 2: שגיאת דחיפה
```bash
# במקרה של שגיאת דחיפה, יש למשוך קודם את השינויים
git pull origin main
# פתרון סתירות אם יש
git push origin main
```

### בעיה 3: ביטול שינויים
```bash
# ביטול שינויים לא שמורים
git checkout .

# ביטול commit אחרון
git reset --soft HEAD~1

# ביטול כמה commits אחרונים
git reset --hard HEAD~n  # n הוא מספר ה-commits לביטול
``` 