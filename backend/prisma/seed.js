// prisma/seed.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seedowanie projektów...');

    // Sprawdź czy już są dane
    const count = await prisma.project.count();
    if (count > 0) {
        console.log('✅ Dane już istnieją, pomijam seedowanie');
        return;
    }

    const projects = [
        {
            name: "Aplikacja mobilna Siły Młodych",
            description: "Tworzenie aplikacji mobilnej dla członków organizacji umożliwiającej łatwy dostęp do informacji i wydarzeń.",
            pillar: "project",
            status: "in_progress",
            estimatedCompletion: new Date("2026-12-31"),
            team: JSON.stringify(["Zosia Wartacz", "Zuzanna Wojtusiak", "Maksym Marczak"]),
            coordinator: "Zosia Wartacz",
        },
        {
            name: "Konferencja Młodych Liderów 2026",
            description: "Organizacja dorocznej konferencji dla młodych liderów z całej Polski.",
            pillar: "conference",
            status: "planning",
            estimatedCompletion: new Date("2026-11-15"),
            team: JSON.stringify(["Adrian Wróblewski", "Wojciech Podolski", "Maja Melerska"]),
            coordinator: "Adrian Wróblewski",
        },
        {
            name: "Kampania społeczna #MłodziGłosują",
            description: "Ogólnopolska kampania zachęcająca młodych ludzi do udziału w wyborach i aktywności obywatelskiej.",
            pillar: "advocacy",
            status: "promotion",
            estimatedCompletion: new Date("2026-10-30"),
            team: JSON.stringify(["Jan Augustynak", "Nikola Socha", "Oliwier Szulejko"]),
            coordinator: "Jan Augustynak",
        },
        {
            name: "Symulacja Sejmu RP",
            description: "Organizacja symulacji obrad Sejmu dla studentów i młodych polityków.",
            pillar: "simulation",
            status: "planning",
            estimatedCompletion: new Date("2027-01-20"),
            team: JSON.stringify(["Igor Piskórz", "Maksym Marczak"]),
            coordinator: "Igor Piskórz",
        },
        {
            name: "Debaty Oksfordzkie",
            description: "Cykl debat oksfordzkich w szkołach średnich promujących umiejętność argumentacji i krytycznego myślenia.",
            pillar: "conference",
            status: "in_progress",
            estimatedCompletion: new Date("2026-12-15"),
            team: JSON.stringify(["Adrian Wróblewski", "Wojciech Podolski", "Emilia Dobias"]),
            coordinator: "Wojciech Podolski",
        },
    ];

    for (const project of projects) {
        await prisma.project.create({
            data: project,
        });
    }

    console.log('✅ Seedowanie zakończone!');
    console.log(`📊 Dodano ${projects.length} projektów`);
}

main()
    .catch((e) => {
        console.error('❌ Błąd seedowania:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });