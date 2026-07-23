// =====================================================
// Country Facts — editorial guidebook data
//
// Used by the info panel to show a compact horizontal
// strip of country facts (capital, language, currency,
// time zone, region). Falls back to "—" for missing data.
// =====================================================

const COUNTRY_FACTS = {
    // === Europe (Schengen + UK + neighbours) ===
    AUT: { capital: "Vienna",      language: "German",       currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    BEL: { capital: "Brussels",    language: "Dutch/French", currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    BGR: { capital: "Sofia",       language: "Bulgarian",    currency: "Lev лв",       timezone: "UTC+2",  region: "Europe" },
    CHE: { capital: "Bern",        language: "German/French",currency: "Franc CHF",    timezone: "UTC+1",  region: "Europe" },
    CYP: { capital: "Nicosia",     language: "Greek",        currency: "Euro €",       timezone: "UTC+2",  region: "Europe" },
    CZE: { capital: "Prague",      language: "Czech",        currency: "Koruna Kč",    timezone: "UTC+1",  region: "Europe" },
    DEU: { capital: "Berlin",      language: "German",       currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    DNK: { capital: "Copenhagen",  language: "Danish",       currency: "Krone kr",     timezone: "UTC+1",  region: "Europe" },
    ESP: { capital: "Madrid",      language: "Spanish",      currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    EST: { capital: "Tallinn",     language: "Estonian",     currency: "Euro €",       timezone: "UTC+2",  region: "Europe" },
    FIN: { capital: "Helsinki",    language: "Finnish",      currency: "Euro €",       timezone: "UTC+2",  region: "Europe" },
    FRA: { capital: "Paris",       language: "French",       currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    GBR: { capital: "London",      language: "English",      currency: "Pound £",      timezone: "UTC+0",  region: "Europe" },
    GRC: { capital: "Athens",      language: "Greek",        currency: "Euro €",       timezone: "UTC+2",  region: "Europe" },
    HRV: { capital: "Zagreb",      language: "Croatian",     currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    HUN: { capital: "Budapest",    language: "Hungarian",    currency: "Forint Ft",    timezone: "UTC+1",  region: "Europe" },
    IRL: { capital: "Dublin",      language: "English/Irish",currency: "Euro €",       timezone: "UTC+0",  region: "Europe" },
    ISL: { capital: "Reykjavík",   language: "Icelandic",    currency: "Króna kr",     timezone: "UTC+0",  region: "Europe" },
    ITA: { capital: "Rome",        language: "Italian",      currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    LIE: { capital: "Vaduz",       language: "German",       currency: "Franc CHF",    timezone: "UTC+1",  region: "Europe" },
    LTU: { capital: "Vilnius",     language: "Lithuanian",   currency: "Euro €",       timezone: "UTC+2",  region: "Europe" },
    LUX: { capital: "Luxembourg",  language: "Luxembourgish",currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    LVA: { capital: "Riga",        language: "Latvian",      currency: "Euro €",       timezone: "UTC+2",  region: "Europe" },
    MLT: { capital: "Valletta",    language: "Maltese",      currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    NLD: { capital: "Amsterdam",   language: "Dutch",        currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    NOR: { capital: "Oslo",        language: "Norwegian",    currency: "Krone kr",     timezone: "UTC+1",  region: "Europe" },
    POL: { capital: "Warsaw",      language: "Polish",       currency: "Złoty zł",     timezone: "UTC+1",  region: "Europe" },
    PRT: { capital: "Lisbon",      language: "Portuguese",   currency: "Euro €",       timezone: "UTC+0",  region: "Europe" },
    ROU: { capital: "Bucharest",   language: "Romanian",     currency: "Leu RON",      timezone: "UTC+2",  region: "Europe" },
    RUS: { capital: "Moscow",      language: "Russian",      currency: "Ruble ₽",      timezone: "UTC+3",  region: "Europe" },
    SVK: { capital: "Bratislava",  language: "Slovak",       currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    SVN: { capital: "Ljubljana",   language: "Slovenian",    currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    SWE: { capital: "Stockholm",   language: "Swedish",      currency: "Krona kr",     timezone: "UTC+1",  region: "Europe" },
    ALB: { capital: "Tirana",      language: "Albanian",     currency: "Lek L",        timezone: "UTC+1",  region: "Europe" },
    SRB: { capital: "Belgrade",    language: "Serbian",      currency: "Dinar дин",    timezone: "UTC+1",  region: "Europe" },
    MNE: { capital: "Podgorica",   language: "Montenegrin",  currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    MKD: { capital: "Skopje",      language: "Macedonian",   currency: "Denar ден",    timezone: "UTC+1",  region: "Europe" },
    BIH: { capital: "Sarajevo",    language: "Bosnian",      currency: "Mark KM",      timezone: "UTC+1",  region: "Europe" },
    UKR: { capital: "Kyiv",        language: "Ukrainian",    currency: "Hryvnia ₴",    timezone: "UTC+2",  region: "Europe" },
    BLR: { capital: "Minsk",       language: "Belarusian",   currency: "Ruble Br",     timezone: "UTC+3",  region: "Europe" },
    MDA: { capital: "Chișinău",    language: "Romanian",     currency: "Leu MDL",      timezone: "UTC+2",  region: "Europe" },
    TUR: { capital: "Ankara",      language: "Turkish",      currency: "Lira ₺",       timezone: "UTC+3",  region: "Europe" },

    // === Americas ===
    USA: { capital: "Washington",  language: "English",      currency: "Dollar $",     timezone: "UTC−5 to −10", region: "N. America" },
    CAN: { capital: "Ottawa",      language: "English/French",currency: "Dollar C$",   timezone: "UTC−4 to −8",  region: "N. America" },
    MEX: { capital: "Mexico City", language: "Spanish",      currency: "Peso $",       timezone: "UTC−6",  region: "N. America" },
    BRA: { capital: "Brasília",    language: "Portuguese",   currency: "Real R$",      timezone: "UTC−3",  region: "S. America" },
    ARG: { capital: "Buenos Aires",language: "Spanish",      currency: "Peso $",       timezone: "UTC−3",  region: "S. America" },
    CHL: { capital: "Santiago",    language: "Spanish",      currency: "Peso CLP",     timezone: "UTC−4",  region: "S. America" },
    COL: { capital: "Bogotá",      language: "Spanish",      currency: "Peso COP",     timezone: "UTC−5",  region: "S. America" },
    PER: { capital: "Lima",        language: "Spanish",      currency: "Sol S/",       timezone: "UTC−5",  region: "S. America" },
    ECU: { capital: "Quito",       language: "Spanish",      currency: "Dollar $",     timezone: "UTC−5",  region: "S. America" },
    VEN: { capital: "Caracas",     language: "Spanish",      currency: "Bolívar Bs",   timezone: "UTC−4",  region: "S. America" },
    URY: { capital: "Montevideo",  language: "Spanish",      currency: "Peso $U",      timezone: "UTC−3",  region: "S. America" },
    CRI: { capital: "San José",    language: "Spanish",      currency: "Colón ₡",      timezone: "UTC−6",  region: "C. America" },
    PAN: { capital: "Panama City", language: "Spanish",      currency: "Balboa B/.",   timezone: "UTC−5",  region: "C. America" },
    CUB: { capital: "Havana",      language: "Spanish",      currency: "Peso $",       timezone: "UTC−5",  region: "Caribbean" },
    DOM: { capital: "Santo Domingo",language:"Spanish",      currency: "Peso $",       timezone: "UTC−4",  region: "Caribbean" },

    // === Asia ===
    JPN: { capital: "Tokyo",       language: "Japanese",     currency: "Yen ¥",        timezone: "UTC+9",  region: "E. Asia" },
    KOR: { capital: "Seoul",       language: "Korean",       currency: "Won ₩",        timezone: "UTC+9",  region: "E. Asia" },
    CHN: { capital: "Beijing",     language: "Mandarin",     currency: "Yuan ¥",       timezone: "UTC+8",  region: "E. Asia" },
    TWN: { capital: "Taipei",      language: "Mandarin",     currency: "Dollar NT$",   timezone: "UTC+8",  region: "E. Asia" },
    HKG: { capital: "Hong Kong",   language: "Cantonese",    currency: "Dollar HK$",   timezone: "UTC+8",  region: "E. Asia" },
    MNG: { capital: "Ulaanbaatar", language: "Mongolian",    currency: "Tögrög ₮",     timezone: "UTC+8",  region: "E. Asia" },
    THA: { capital: "Bangkok",     language: "Thai",         currency: "Baht ฿",       timezone: "UTC+7",  region: "SE Asia" },
    VNM: { capital: "Hanoi",       language: "Vietnamese",   currency: "Đồng ₫",       timezone: "UTC+7",  region: "SE Asia" },
    SGP: { capital: "Singapore",   language: "English",      currency: "Dollar S$",    timezone: "UTC+8",  region: "SE Asia" },
    MYS: { capital: "Kuala Lumpur",language: "Malay",        currency: "Ringgit RM",   timezone: "UTC+8",  region: "SE Asia" },
    IDN: { capital: "Jakarta",     language: "Indonesian",   currency: "Rupiah Rp",    timezone: "UTC+7",  region: "SE Asia" },
    PHL: { capital: "Manila",      language: "Filipino",     currency: "Peso ₱",       timezone: "UTC+8",  region: "SE Asia" },
    KHM: { capital: "Phnom Penh",  language: "Khmer",        currency: "Riel ៛",       timezone: "UTC+7",  region: "SE Asia" },
    LAO: { capital: "Vientiane",   language: "Lao",          currency: "Kip ₭",        timezone: "UTC+7",  region: "SE Asia" },
    MMR: { capital: "Naypyidaw",   language: "Burmese",      currency: "Kyat K",       timezone: "UTC+6:30",region: "SE Asia" },
    BRN: { capital: "Bandar SB",   language: "Malay",        currency: "Dollar B$",    timezone: "UTC+8",  region: "SE Asia" },
    IND: { capital: "New Delhi",   language: "Hindi/English",currency: "Rupee ₹",      timezone: "UTC+5:30",region: "S. Asia" },
    PAK: { capital: "Islamabad",   language: "Urdu",         currency: "Rupee ₨",      timezone: "UTC+5",  region: "S. Asia" },
    BGD: { capital: "Dhaka",       language: "Bengali",      currency: "Taka ৳",       timezone: "UTC+6",  region: "S. Asia" },
    LKA: { capital: "Colombo",     language: "Sinhala/Tamil",currency: "Rupee Rs",     timezone: "UTC+5:30",region: "S. Asia" },
    NPL: { capital: "Kathmandu",   language: "Nepali",       currency: "Rupee NPR",    timezone: "UTC+5:45",region: "S. Asia" },
    BTN: { capital: "Thimphu",     language: "Dzongkha",     currency: "Ngultrum Nu",  timezone: "UTC+6",  region: "S. Asia" },
    MDV: { capital: "Malé",        language: "Dhivehi",      currency: "Rufiyaa Rf",   timezone: "UTC+5",  region: "S. Asia" },
    KAZ: { capital: "Astana",      language: "Kazakh/Russian",currency:"Tenge ₸",      timezone: "UTC+5",  region: "C. Asia" },
    UZB: { capital: "Tashkent",    language: "Uzbek",        currency: "Som soʻm",     timezone: "UTC+5",  region: "C. Asia" },

    // === Middle East ===
    ARE: { capital: "Abu Dhabi",   language: "Arabic",       currency: "Dirham د.إ",   timezone: "UTC+4",  region: "Middle East" },
    SAU: { capital: "Riyadh",      language: "Arabic",       currency: "Riyal ﷼",      timezone: "UTC+3",  region: "Middle East" },
    QAT: { capital: "Doha",        language: "Arabic",       currency: "Riyal ﷼",      timezone: "UTC+3",  region: "Middle East" },
    KWT: { capital: "Kuwait City", language: "Arabic",       currency: "Dinar د.ك",    timezone: "UTC+3",  region: "Middle East" },
    BHR: { capital: "Manama",      language: "Arabic",       currency: "Dinar .د.ب",   timezone: "UTC+3",  region: "Middle East" },
    OMN: { capital: "Muscat",      language: "Arabic",       currency: "Rial ﷼",       timezone: "UTC+4",  region: "Middle East" },
    JOR: { capital: "Amman",       language: "Arabic",       currency: "Dinar JD",     timezone: "UTC+3",  region: "Middle East" },
    LBN: { capital: "Beirut",      language: "Arabic",       currency: "Pound ل.ل",    timezone: "UTC+2",  region: "Middle East" },
    ISR: { capital: "Jerusalem",   language: "Hebrew",       currency: "Shekel ₪",     timezone: "UTC+2",  region: "Middle East" },
    IRN: { capital: "Tehran",      language: "Persian",      currency: "Rial ﷼",       timezone: "UTC+3:30",region: "Middle East" },
    IRQ: { capital: "Baghdad",     language: "Arabic",       currency: "Dinar ع.د",    timezone: "UTC+3",  region: "Middle East" },
    EGY: { capital: "Cairo",       language: "Arabic",       currency: "Pound ج.م",    timezone: "UTC+2",  region: "Middle East" },

    // === Africa ===
    MAR: { capital: "Rabat",       language: "Arabic",       currency: "Dirham د.م.",  timezone: "UTC+1",  region: "N. Africa" },
    DZA: { capital: "Algiers",     language: "Arabic",       currency: "Dinar د.ج",    timezone: "UTC+1",  region: "N. Africa" },
    TUN: { capital: "Tunis",       language: "Arabic",       currency: "Dinar د.ت",    timezone: "UTC+1",  region: "N. Africa" },
    ZAF: { capital: "Pretoria",    language: "11 official",  currency: "Rand R",       timezone: "UTC+2",  region: "Africa" },
    KEN: { capital: "Nairobi",     language: "Swahili/English",currency:"Shilling KSh",timezone: "UTC+3",  region: "Africa" },
    NGA: { capital: "Abuja",       language: "English",      currency: "Naira ₦",      timezone: "UTC+1",  region: "Africa" },
    ETH: { capital: "Addis Ababa", language: "Amharic",      currency: "Birr Br",      timezone: "UTC+3",  region: "Africa" },
    GHA: { capital: "Accra",       language: "English",      currency: "Cedi ₵",       timezone: "UTC+0",  region: "Africa" },
    TZA: { capital: "Dodoma",      language: "Swahili",      currency: "Shilling TSh", timezone: "UTC+3",  region: "Africa" },
    UGA: { capital: "Kampala",     language: "English",      currency: "Shilling USh", timezone: "UTC+3",  region: "Africa" },
    SEN: { capital: "Dakar",       language: "French",       currency: "Franc CFA",    timezone: "UTC+0",  region: "Africa" },

    // === Oceania ===
    AUS: { capital: "Canberra",    language: "English",      currency: "Dollar A$",    timezone: "UTC+8 to +11",region: "Oceania" },
    NZL: { capital: "Wellington",  language: "English",      currency: "Dollar NZ$",   timezone: "UTC+12", region: "Oceania" },
    FJI: { capital: "Suva",        language: "English",      currency: "Dollar FJ$",   timezone: "UTC+12", region: "Oceania" },
    PNG: { capital: "Port Moresby",language: "English",      currency: "Kina K",       timezone: "UTC+10", region: "Oceania" },

    // === Additional Europe ===
    AND: { capital: "Andorra la Vella",language:"Catalan",   currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    MCO: { capital: "Monaco",      language: "French",       currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    SMR: { capital: "San Marino",  language: "Italian",      currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    VAT: { capital: "Vatican City",language: "Italian/Latin",currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },
    XKX: { capital: "Pristina",    language: "Albanian",     currency: "Euro €",       timezone: "UTC+1",  region: "Europe" },

    // === Additional Caucasus / Central Asia ===
    GEO: { capital: "Tbilisi",     language: "Georgian",     currency: "Lari ₾",       timezone: "UTC+4",  region: "C. Asia" },
    AZE: { capital: "Baku",        language: "Azerbaijani",  currency: "Manat ₼",      timezone: "UTC+4",  region: "C. Asia" },
    ARM: { capital: "Yerevan",     language: "Armenian",     currency: "Dram ֏",       timezone: "UTC+4",  region: "C. Asia" },
    KGZ: { capital: "Bishkek",     language: "Kyrgyz",       currency: "Som с",        timezone: "UTC+6",  region: "C. Asia" },
    TJK: { capital: "Dushanbe",    language: "Tajik",        currency: "Somoni SM",    timezone: "UTC+5",  region: "C. Asia" },
    TKM: { capital: "Ashgabat",    language: "Turkmen",      currency: "Manat T",      timezone: "UTC+5",  region: "C. Asia" },

    // === Additional Asia ===
    AFG: { capital: "Kabul",       language: "Pashto/Dari",  currency: "Afghani ؋",    timezone: "UTC+4:30",region: "S. Asia" },
    MAC: { capital: "Macau",       language: "Cantonese",    currency: "Pataca MOP$",  timezone: "UTC+8",  region: "E. Asia" },
    PRK: { capital: "Pyongyang",   language: "Korean",       currency: "Won ₩",        timezone: "UTC+9",  region: "E. Asia" },
    TLS: { capital: "Dili",        language: "Tetum/Portuguese",currency:"Dollar $",   timezone: "UTC+9",  region: "SE Asia" },

    // === Additional Middle East ===
    PSE: { capital: "Ramallah",    language: "Arabic",       currency: "Shekel ₪",     timezone: "UTC+2",  region: "Middle East" },
    SYR: { capital: "Damascus",    language: "Arabic",       currency: "Pound £S",     timezone: "UTC+3",  region: "Middle East" },
    YEM: { capital: "Sana'a",      language: "Arabic",       currency: "Rial ﷼",       timezone: "UTC+3",  region: "Middle East" },

    // === Additional North Africa ===
    LBY: { capital: "Tripoli",     language: "Arabic",       currency: "Dinar ل.د",    timezone: "UTC+2",  region: "N. Africa" },
    SDN: { capital: "Khartoum",    language: "Arabic",       currency: "Pound ج.س.",   timezone: "UTC+2",  region: "N. Africa" },
    SSD: { capital: "Juba",        language: "English",      currency: "Pound SSP",    timezone: "UTC+2",  region: "Africa" },

    // === West & Central Africa ===
    AGO: { capital: "Luanda",      language: "Portuguese",   currency: "Kwanza Kz",    timezone: "UTC+1",  region: "Africa" },
    BEN: { capital: "Porto-Novo",  language: "French",       currency: "Franc CFA",    timezone: "UTC+1",  region: "Africa" },
    BFA: { capital: "Ouagadougou", language: "French",       currency: "Franc CFA",    timezone: "UTC+0",  region: "Africa" },
    BDI: { capital: "Gitega",      language: "French/Kirundi",currency:"Franc FBu",    timezone: "UTC+2",  region: "Africa" },
    CMR: { capital: "Yaoundé",     language: "French/English",currency:"Franc CFA",   timezone: "UTC+1",  region: "Africa" },
    CPV: { capital: "Praia",       language: "Portuguese",   currency: "Escudo $",     timezone: "UTC−1",  region: "Africa" },
    CAF: { capital: "Bangui",      language: "French/Sango", currency: "Franc CFA",    timezone: "UTC+1",  region: "Africa" },
    TCD: { capital: "N'Djamena",   language: "French/Arabic",currency: "Franc CFA",    timezone: "UTC+1",  region: "Africa" },
    COM: { capital: "Moroni",      language: "Comorian",     currency: "Franc KMF",    timezone: "UTC+3",  region: "Africa" },
    COG: { capital: "Brazzaville", language: "French",       currency: "Franc CFA",    timezone: "UTC+1",  region: "Africa" },
    COD: { capital: "Kinshasa",    language: "French",       currency: "Franc FC",     timezone: "UTC+1 to +2",region: "Africa" },
    CIV: { capital: "Yamoussoukro",language: "French",       currency: "Franc CFA",    timezone: "UTC+0",  region: "Africa" },
    DJI: { capital: "Djibouti",    language: "French/Arabic",currency: "Franc Fdj",    timezone: "UTC+3",  region: "Africa" },
    GNQ: { capital: "Malabo",      language: "Spanish",      currency: "Franc CFA",    timezone: "UTC+1",  region: "Africa" },
    ERI: { capital: "Asmara",      language: "Tigrinya",     currency: "Nakfa Nfk",    timezone: "UTC+3",  region: "Africa" },
    SWZ: { capital: "Mbabane",     language: "Swazi/English",currency: "Lilangeni E",  timezone: "UTC+2",  region: "Africa" },
    GAB: { capital: "Libreville",  language: "French",       currency: "Franc CFA",    timezone: "UTC+1",  region: "Africa" },
    GMB: { capital: "Banjul",      language: "English",      currency: "Dalasi D",     timezone: "UTC+0",  region: "Africa" },
    GIN: { capital: "Conakry",     language: "French",       currency: "Franc GNF",    timezone: "UTC+0",  region: "Africa" },
    GNB: { capital: "Bissau",      language: "Portuguese",   currency: "Franc CFA",    timezone: "UTC+0",  region: "Africa" },
    LSO: { capital: "Maseru",      language: "Sesotho/English",currency:"Loti L",      timezone: "UTC+2",  region: "Africa" },
    LBR: { capital: "Monrovia",    language: "English",      currency: "Dollar L$",    timezone: "UTC+0",  region: "Africa" },
    MDG: { capital: "Antananarivo",language: "Malagasy/French",currency:"Ariary Ar",   timezone: "UTC+3",  region: "Africa" },
    MWI: { capital: "Lilongwe",    language: "Chichewa/English",currency:"Kwacha MK",  timezone: "UTC+2",  region: "Africa" },
    MLI: { capital: "Bamako",      language: "French",       currency: "Franc CFA",    timezone: "UTC+0",  region: "Africa" },
    MRT: { capital: "Nouakchott",  language: "Arabic",       currency: "Ouguiya UM",   timezone: "UTC+0",  region: "Africa" },
    MUS: { capital: "Port Louis",  language: "English/French",currency:"Rupee ₨",      timezone: "UTC+4",  region: "Africa" },
    MOZ: { capital: "Maputo",      language: "Portuguese",   currency: "Metical MT",   timezone: "UTC+2",  region: "Africa" },
    NAM: { capital: "Windhoek",    language: "English",      currency: "Dollar N$",    timezone: "UTC+2",  region: "Africa" },
    NER: { capital: "Niamey",      language: "French",       currency: "Franc CFA",    timezone: "UTC+1",  region: "Africa" },
    RWA: { capital: "Kigali",      language: "Kinyarwanda",  currency: "Franc RF",     timezone: "UTC+2",  region: "Africa" },
    STP: { capital: "São Tomé",    language: "Portuguese",   currency: "Dobra Db",     timezone: "UTC+0",  region: "Africa" },
    SYC: { capital: "Victoria",    language: "Seychellois",  currency: "Rupee SR",     timezone: "UTC+4",  region: "Africa" },
    SLE: { capital: "Freetown",    language: "English",      currency: "Leone Le",     timezone: "UTC+0",  region: "Africa" },
    SOM: { capital: "Mogadishu",   language: "Somali/Arabic",currency: "Shilling Sh",  timezone: "UTC+3",  region: "Africa" },
    TGO: { capital: "Lomé",        language: "French",       currency: "Franc CFA",    timezone: "UTC+0",  region: "Africa" },
    BWA: { capital: "Gaborone",    language: "English/Tswana",currency:"Pula P",       timezone: "UTC+2",  region: "Africa" },
    ZMB: { capital: "Lusaka",      language: "English",      currency: "Kwacha ZK",    timezone: "UTC+2",  region: "Africa" },
    ZWE: { capital: "Harare",      language: "English/Shona",currency: "Dollar Z$",    timezone: "UTC+2",  region: "Africa" },

    // === Caribbean ===
    ATG: { capital: "St. John's",  language: "English",      currency: "Dollar EC$",   timezone: "UTC−4",  region: "Caribbean" },
    BHS: { capital: "Nassau",      language: "English",      currency: "Dollar B$",    timezone: "UTC−5",  region: "Caribbean" },
    BRB: { capital: "Bridgetown",  language: "English",      currency: "Dollar Bds$",  timezone: "UTC−4",  region: "Caribbean" },
    DMA: { capital: "Roseau",      language: "English",      currency: "Dollar EC$",   timezone: "UTC−4",  region: "Caribbean" },
    GRD: { capital: "St. George's",language: "English",      currency: "Dollar EC$",   timezone: "UTC−4",  region: "Caribbean" },
    HTI: { capital: "Port-au-Prince",language:"French/Creole",currency:"Gourde G",     timezone: "UTC−5",  region: "Caribbean" },
    JAM: { capital: "Kingston",    language: "English",      currency: "Dollar J$",    timezone: "UTC−5",  region: "Caribbean" },
    KNA: { capital: "Basseterre",  language: "English",      currency: "Dollar EC$",   timezone: "UTC−4",  region: "Caribbean" },
    LCA: { capital: "Castries",    language: "English",      currency: "Dollar EC$",   timezone: "UTC−4",  region: "Caribbean" },
    VCT: { capital: "Kingstown",   language: "English",      currency: "Dollar EC$",   timezone: "UTC−4",  region: "Caribbean" },
    TTO: { capital: "Port of Spain",language:"English",      currency: "Dollar TT$",   timezone: "UTC−4",  region: "Caribbean" },

    // === Central America ===
    BLZ: { capital: "Belmopan",    language: "English",      currency: "Dollar BZ$",   timezone: "UTC−6",  region: "C. America" },
    SLV: { capital: "San Salvador",language: "Spanish",      currency: "Dollar $",     timezone: "UTC−6",  region: "C. America" },
    GTM: { capital: "Guatemala City",language:"Spanish",     currency: "Quetzal Q",    timezone: "UTC−6",  region: "C. America" },
    HND: { capital: "Tegucigalpa", language: "Spanish",      currency: "Lempira L",    timezone: "UTC−6",  region: "C. America" },
    NIC: { capital: "Managua",     language: "Spanish",      currency: "Córdoba C$",   timezone: "UTC−6",  region: "C. America" },

    // === Additional South America ===
    BOL: { capital: "La Paz/Sucre",language: "Spanish",      currency: "Boliviano Bs", timezone: "UTC−4",  region: "S. America" },
    PRY: { capital: "Asunción",    language: "Spanish/Guarani",currency:"Guaraní ₲",   timezone: "UTC−4",  region: "S. America" },
    GUY: { capital: "Georgetown",  language: "English",      currency: "Dollar GY$",   timezone: "UTC−4",  region: "S. America" },
    SUR: { capital: "Paramaribo",  language: "Dutch",        currency: "Dollar SR$",   timezone: "UTC−3",  region: "S. America" },

    // === Oceania (small island states) ===
    FSM: { capital: "Palikir",     language: "English",      currency: "Dollar $",     timezone: "UTC+10 to +11",region:"Oceania" },
    KIR: { capital: "Tarawa",      language: "English",      currency: "Dollar A$",    timezone: "UTC+12 to +14",region: "Oceania" },
    MHL: { capital: "Majuro",      language: "Marshallese",  currency: "Dollar $",     timezone: "UTC+12", region: "Oceania" },
    NRU: { capital: "Yaren",       language: "Nauruan/English",currency:"Dollar A$",   timezone: "UTC+12", region: "Oceania" },
    PLW: { capital: "Ngerulmud",   language: "Palauan/English",currency:"Dollar $",    timezone: "UTC+9",  region: "Oceania" },
    WSM: { capital: "Apia",        language: "Samoan/English",currency:"Tala WS$",     timezone: "UTC+13", region: "Oceania" },
    SLB: { capital: "Honiara",     language: "English",      currency: "Dollar SI$",   timezone: "UTC+11", region: "Oceania" },
    TON: { capital: "Nukuʻalofa",  language: "Tongan/English",currency:"Paʻanga T$",   timezone: "UTC+13", region: "Oceania" },
    TUV: { capital: "Funafuti",    language: "Tuvaluan/English",currency:"Dollar A$",  timezone: "UTC+12", region: "Oceania" },
    VUT: { capital: "Port Vila",   language: "Bislama",      currency: "Vatu VT",      timezone: "UTC+11", region: "Oceania" }
};

// =====================================================
// Status Templates — generic info per visa type.
// Used when no per-country enrichment data is available.
// All sections are optional — render only when defined.
// =====================================================
const STATUS_TEMPLATES = {
    visa_free: {
        documents: [
            "Passport valid 3+ months beyond stay",
            "Return or onward ticket",
            "Proof of accommodation (sometimes asked)"
        ],
        processing: null,
        fee: null,
        validity: null
    },
    e_visa: {
        documents: [
            "Passport valid 6+ months",
            "Recent digital passport photo",
            "Credit or debit card for payment",
            "Travel itinerary or accommodation"
        ],
        processing: "1–3 days",
        fee: "$25–50",
        validity: "30–90 days"
    },
    visa_required: {
        documents: [
            "Passport valid 6+ months beyond stay",
            "Completed visa application form",
            "Recent passport photograph",
            "Proof of accommodation",
            "Proof of return or onward travel",
            "Travel insurance"
        ],
        processing: "7–14 days",
        fee: "$60–120",
        validity: "Varies"
    },
    home: {
        documents: null,
        processing: null,
        fee: null,
        validity: null
    }
};

// Expose facts and templates globally for app.js
// (no module system in this static site)
