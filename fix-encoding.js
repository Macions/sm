// fix-encoding.js - wersja ES Module
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// KONFIGURACJA
// ============================================================
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.scss'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage'];

// Mapowanie zepsutych znaków na poprawne
const FIX_MAP = {
    // Ą
    'Ä…': 'ą',
    'Ä„': 'Ą',
    
    // Ć
    'Ä‡': 'ć',
    'Ä†': 'Ć',
    
    // Ę
    'Ä™': 'ę',
    'Ä˜': 'Ę',
    
    // Ł
    'Ĺ‚': 'ł',
    'Ĺ': 'Ł',
    
    // Ń
    'Ĺ„': 'ń',
    'Ĺƒ': 'Ń',
    
    // Ó
    'Ăł': 'ó',
    'Ă“': 'Ó',
    
    // Ś
    'Ĺ›': 'ś',
    'Ĺš': 'Ś',
    
    // Ź
    'Ĺş': 'ź',
    'Ĺą': 'Ź',
    
    // Ż
    'ĹĽ': 'ż',
    'Ĺ»': 'Ż',
    
    // Inne często występujące
    'Ä™': 'ę',
    'Ä‡': 'ć',
    'Ä…': 'ą',
    'Ĺ‚': 'ł',
    'Ä„': 'Ą',
    'Ä†': 'Ć',
    'Ä˜': 'Ę',
    'Ĺ': 'Ł',
    'Ĺƒ': 'Ń',
    'Ĺš': 'Ś',
    'Ĺą': 'Ź',
    'Ĺ»': 'Ż',
    'ĹŻ': 'Ź',
    
    // Dodatkowe dla pewności
    'Ä…': 'ą',
    'Ä‡': 'ć',
    'Ä™': 'ę',
    'Ĺ‚': 'ł',
    'Ĺ„': 'ń',
    'Ăł': 'ó',
    'Ĺ›': 'ś',
    'Ĺş': 'ź',
    'ĹĽ': 'ż',
    'Ä„': 'Ą',
    'Ä†': 'Ć',
    'Ä˜': 'Ę',
    'Ĺ': 'Ł',
    'Ĺƒ': 'Ń',
    'Ă“': 'Ó',
    'Ĺš': 'Ś',
    'Ĺą': 'Ź',
    'Ĺ»': 'Ż',
};

function fixText(text) {
    let fixed = text;
    for (const [bad, good] of Object.entries(FIX_MAP)) {
        fixed = fixed.replaceAll(bad, good);
    }
    return fixed;
}

function processFile(filePath) {
    try {
        // Odczytaj plik
        const content = fs.readFileSync(filePath, 'utf8');
        const fixedContent = fixText(content);
        
        // Zapisz jako UTF-8
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        // console.log(`✅ Naprawiono: ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`❌ Błąd przetwarzania ${filePath}:`, error.message);
    }
}

function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fullPath === __filename) continue;
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (EXCLUDE_DIRS.includes(file)) continue;
            walkDirectory(fullPath);
        } else {
            const ext = path.extname(file);
            if (EXTENSIONS.includes(ext)) {
                processFile(fullPath);
            }
        }
    }
}

// ============================================================
// START
// ============================================================
// console.log('🔧 Naprawianie kodowania znaków...');
// console.log('📂 Skanowanie: ' + process.cwd());
// console.log('');

walkDirectory(process.cwd());

// console.log('');
// console.log('✅ Zakończono!');
// console.log('📌 Sprawdź pliki i skomentuj ten skrypt w .gitignore');