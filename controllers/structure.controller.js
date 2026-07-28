"use strict";
// A:\sm system\sm\backend\src\controllers\structure.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructureController = void 0;
const structure_service_1 = require("../services/structure.service");
const structureService = new structure_service_1.StructureService();
class StructureController {
    async getFullStructure(req, res) {
        try {
            const structure = await structureService.getFullStructure();
            res.json(structure);
        }
        catch (error) {
            console.error("Błąd pobierania struktury:", error);
            res.status(500).json({
                error: "Nie udało się pobrać struktury organizacyjnej"
            });
        }
    }
    async getTeamById(req, res) {
        try {
            // Pobierz id i upewnij się, że to string
            const idParam = req.params.id;
            // Walidacja - jeśli to tablica, weź pierwszy element
            const idString = Array.isArray(idParam) ? idParam[0] : idParam;
            // Sprawdź czy id istnieje
            if (!idString) {
                return res.status(400).json({
                    error: "Brak identyfikatora zespołu"
                });
            }
            // Konwersja na liczbę
            const id = parseInt(idString, 10);
            // Sprawdź czy konwersja się powiodła
            if (isNaN(id)) {
                return res.status(400).json({
                    error: "Nieprawidłowy identyfikator zespołu"
                });
            }
            const team = await structureService.getTeamById(id);
            if (!team) {
                return res.status(404).json({
                    error: "Zespół nie znaleziony"
                });
            }
            res.json(team);
        }
        catch (error) {
            console.error("Błąd pobierania zespołu:", error);
            res.status(500).json({
                error: "Nie udało się pobrać zespołu"
            });
        }
    }
}
exports.StructureController = StructureController;
