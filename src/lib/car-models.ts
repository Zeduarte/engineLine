/**
 * Modelos por marca para o autocomplete dependente do backoffice.
 * As chaves TÊM de coincidir exactamente com as entradas de `CAR_BRANDS`.
 *
 * Não é exaustivo — cobre as marcas/modelos mais comuns no mercado português.
 * Para marcas sem lista aqui, o campo Modelo continua a aceitar texto livre.
 */
export const CAR_MODELS: Record<string, string[]> = {
  Audi: [
    "A1", "A3", "A4", "A4 Avant", "A5", "A6", "A6 Avant", "A7", "A8",
    "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "TT", "e-tron", "RS3", "RS6", "S3",
  ],
  BMW: [
    "Série 1", "Série 2", "Série 3", "Série 4", "Série 5", "Série 6", "Série 7",
    "Série 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX",
    "M2", "M3", "M4",
  ],
  "Mercedes-Benz": [
    "Classe A", "Classe B", "Classe C", "Classe E", "Classe S", "CLA", "CLS",
    "GLA", "GLB", "GLC", "GLE", "GLS", "Classe G", "EQA", "EQB", "EQC", "SL", "AMG GT",
  ],
  Volkswagen: [
    "Polo", "Golf", "Golf Variant", "Passat", "Passat Variant", "Arteon",
    "T-Cross", "T-Roc", "Tiguan", "Touareg", "Touran", "Sharan", "ID.3", "ID.4",
    "ID.5", "Up", "Caddy", "Transporter",
  ],
  Renault: [
    "Clio", "Captur", "Mégane", "Mégane E-Tech", "Arkana", "Kadjar", "Austral",
    "Scénic", "Espace", "Kangoo", "Trafic", "Zoe", "Twingo",
  ],
  Peugeot: [
    "108", "208", "e-208", "308", "308 SW", "408", "508", "2008", "e-2008",
    "3008", "5008", "Partner", "Rifter", "Expert",
  ],
  Citroën: [
    "C1", "C3", "C3 Aircross", "C4", "ë-C4", "C4 X", "C5 X", "C5 Aircross",
    "Berlingo", "SpaceTourer", "Jumpy",
  ],
  Opel: [
    "Corsa", "Corsa-e", "Astra", "Astra Sports Tourer", "Insignia", "Mokka",
    "Crossland", "Grandland", "Combo", "Zafira",
  ],
  Ford: [
    "Fiesta", "Focus", "Focus SW", "Mondeo", "Puma", "Kuga", "EcoSport",
    "Explorer", "Mustang", "Mustang Mach-E", "Ranger", "Transit", "Transit Custom",
  ],
  Fiat: [
    "500", "500e", "500X", "500L", "Panda", "Tipo", "Punto", "Doblò", "Ducato",
  ],
  Toyota: [
    "Aygo", "Aygo X", "Yaris", "Yaris Cross", "Corolla", "Corolla Touring Sports",
    "C-HR", "RAV4", "Prius", "Camry", "Highlander", "Land Cruiser", "Hilux", "Proace",
  ],
  Nissan: [
    "Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "Note", "Navara",
  ],
  Seat: [
    "Ibiza", "Leon", "Leon Sportstourer", "Arona", "Ateca", "Tarraco", "Alhambra",
  ],
  Cupra: ["Leon", "Formentor", "Born", "Ateca", "Tavascan"],
  "Škoda": [
    "Fabia", "Scala", "Octavia", "Octavia Combi", "Superb", "Superb Combi",
    "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Rapid",
  ],
  Dacia: ["Sandero", "Sandero Stepway", "Logan", "Duster", "Jogger", "Spring"],
  Volvo: [
    "V40", "V60", "V90", "S60", "S90", "XC40", "XC60", "XC90", "C40", "EX30",
  ],
  Hyundai: [
    "i10", "i20", "i30", "i30 SW", "Bayon", "Kona", "Tucson", "Santa Fe",
    "Ioniq", "Ioniq 5", "Ioniq 6",
  ],
  Kia: [
    "Picanto", "Rio", "Ceed", "Ceed SW", "XCeed", "Stonic", "Niro", "Sportage",
    "Sorento", "EV6", "e-Niro",
  ],
  Mazda: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-60", "MX-5", "MX-30"],
  Honda: ["Jazz", "Civic", "HR-V", "CR-V", "e", "ZR-V"],
  Mitsubishi: ["Space Star", "ASX", "Eclipse Cross", "Outlander", "L200"],
  Suzuki: ["Ignis", "Swift", "Vitara", "S-Cross", "Jimny", "Across"],
  Mini: ["Cooper", "Cooper S", "One", "Clubman", "Countryman", "Cabrio"],
  Jeep: ["Renegade", "Compass", "Avenger", "Wrangler", "Grand Cherokee"],
  "Land Rover": [
    "Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport",
    "Range Rover Evoque", "Range Rover Velar",
  ],
  Jaguar: ["XE", "XF", "E-Pace", "F-Pace", "I-Pace", "F-Type"],
  Porsche: ["911", "718 Cayman", "718 Boxster", "Panamera", "Macan", "Cayenne", "Taycan"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  Lexus: ["CT", "IS", "ES", "UX", "NX", "RX", "RC"],
  DS: ["DS 3", "DS 4", "DS 7", "DS 9"],
  "Alfa Romeo": ["Giulietta", "Giulia", "Stelvio", "Tonale", "MiTo"],
  MG: ["MG3", "MG4", "MG5", "ZS", "HS", "Marvel R"],
  Smart: ["ForTwo", "ForFour", "#1", "#3"],
  BYD: ["Atto 3", "Dolphin", "Seal", "Han", "Tang"],
  Subaru: ["Impreza", "XV", "Forester", "Outback", "Levorg"],
  Lancia: ["Ypsilon", "Delta"],
  Abarth: ["595", "695", "500e"],
  Polestar: ["Polestar 2", "Polestar 3", "Polestar 4"],
};
