import { useCallback } from "react";
import { useLanguage } from "./LanguageContext";

// Srpski tekst je ključ, engleski je prevod.
// Slugove, ID-jeve, URL-ove i podatke iz baze ne diramo.

const en = {
  // POČETNA STRANICA PREPORUKA

  "← МУЗИКА": "← MUSIC",
  "← ПРЕПОРУКЕ": "← RECOMMENDATIONS",
  "← ПЛЕЈЛИСТЕ": "← PLAYLISTS",

  "ПРЕПОРУКЕ / 01": "RECOMMENDATIONS / 01",
  "ПРЕПОРУКЕ / 04": "RECOMMENDATIONS / 04",
  "ПРЕПОРУКЕ": "RECOMMENDATIONS",

  "ШТА ТРАЖИШ?": "WHAT ARE YOU LOOKING FOR?",
  "Изабери полицу.": "Choose a shelf.",

  "ПОЛИЦА 01": "SHELF 01",
  "ПОЛИЦА 02": "SHELF 02",
  "ПОЛИЦА 03": "SHELF 03",
  "ПОЛИЦА 04": "SHELF 04",

  "ДИСКОВИ": "RECORDS",
  "ПЛЕЈЛИСТЕ": "PLAYLISTS",
  "РАДИО ДРАМЕ": "RADIO DRAMAS",

  "Појединачне препоруке. Претражуј по жанру, извођачу и години.":
    "Individual music picks. Browse by genre, artist, or year.",

  "Моји сетови песама, сложени као пластични балк дискова.":
    "My song selections, stacked like a spindle of CDs.",

  "Приче за слушање, сложене као старе аудио касете.":
    "Stories made for listening, collected like old cassettes.",

  "ОТВОРИ ПОЛИЦУ →": "OPEN SHELF →",

  "ТВОЈА": "YOUR",
  "ПРЕПОРУКА": "RECOMMENDATION",
  "ПОШАЉИ": "SEND A",
  "ПРЕПОРУКУ": "RECOMMENDATION",
  "ПОШАЉИ ПРЕПОРУКУ": "SEND A RECOMMENDATION",

  "Пошаљи ми песму, плејлисту или радио драму коју вреди чути.":
    "Send me a song, playlist, or radio drama worth hearing.",

  "ОСТАВИ ПРЕПОРУКУ →": "SUBMIT A RECOMMENDATION →",

  // DISKOVI

  "ПРЕПОРУКЕ / ДИСКОВИ": "RECOMMENDATIONS / RECORDS",
  "ВИНИЛ ПОЛИЦА": "VINYL SHELF",

  "Претражи, филтрирај и извуци плочу.":
    "Search, filter, and pick a record.",

  "ПРЕТРАГА": "SEARCH",
  "Песма, извођач, жанр...": "Song, artist, genre...",

  "ЖАНР": "GENRE",
  "СВИ ЖАНРОВИ": "ALL GENRES",
  "ИЗВОЂАЧ": "ARTIST",
  "СВИ ИЗВОЂАЧИ": "ALL ARTISTS",

  "ГОДИНА": "YEAR",
  "СВЕ ГОДИНЕ": "ALL YEARS",
  "РЕДОСЛЕД": "SORT BY",
  "МОЈ РЕДОСЛЕД": "MY ORDER",
  "НАЗИВ": "TITLE",
  "НАЈНОВИЈЕ": "NEWEST",

  "ГОДИНА ↓": "YEAR ↓",
  "ГОДИНА ↑": "YEAR ↑",

  "РЕСЕТ": "RESET",
  "ПРОНАЂЕНО": "FOUND",

  "Учитавање плоча...": "Loading records...",

  "Дискове тренутно није могуће учитати.":
    "Records couldn't be loaded right now.",

  "Нема плоча које одговарају овом филтеру.":
    "No records match these filters.",

  "ИЗВУЦИ ПЛОЧУ →": "PULL OUT A RECORD →",

  "СЕКИ": "SEKI",
  "СЕКИ / ЗВУЧНИК": "SEKI / BOOMBOX",
  "SEKI / ЗВУЧНИК": "SEKI / BOOMBOX",

  "ПРЕВОД / АНАЛИЗА": "TRANSLATION / ANALYSIS",
  "РАДИО ДРАМА": "RADIO DRAMA",

  "БЕЗ ЖАНРА": "NO GENRE",
  "НЕПОЗНАТ ИЗВОЂАЧ": "UNKNOWN ARTIST",

  // PLEJLISTE

  "Изабери плејлисту по жељи, фазону и мери.":
    "Pick a playlist to suit your mood.",

  "Назив плејлисте...": "Playlist title...",
  "Учитавање...": "Loading...",

  "Плејлисте тренутно није могуће учитати.":
    "Playlists couldn't be loaded right now.",

  "Још нема објављених плејлиста.":
    "No playlists have been published yet.",

  "ПЛЕЈЛИСТА": "PLAYLIST",
  "ПЕСМА": "SONG",
  "ПЕСАМА": "SONGS",

  "Без описа.": "No description.",
  "ОТВОРИ ПЛЕЈЛИСТУ →": "OPEN PLAYLIST →",

  "Учитавање плејлисте...": "Loading playlist...",

  "Плејлисту тренутно није могуће учитати.":
    "This playlist couldn't be loaded right now.",

  "ПРИПРЕМА ПЛЕЈЛИСТЕ...": "PREPARING PLAYLIST...",

  "ПУСТИ НА РАДИЈУ ▶": "PLAY ON THE BOOMBOX ▶",

  "Плејлиста нема доступне YouTube песме.":
    "This playlist has no available YouTube tracks.",

  "Учитавање списка песама...": "Loading track list...",

  "Списак песама тренутно није могуће учитати.":
    "The track list couldn't be loaded right now.",

  "Нема доступних песама.": "No tracks available.",

  "+ још": "+ another",
  "песама у плејлисти": "songs in the playlist",

  "ЧИТАЈ": "READ",
  "НАЗАД У ПЛЕЈЛИСТУ": "BACK TO PLAYLIST",

  // RADIO DRAME

  "ПРЕПОРУКЕ / РАДИО ДРАМЕ":
    "RECOMMENDATIONS / RADIO DRAMAS",

  "КАСЕТЕ": "CASSETTES",
  "Изабери касету.": "Choose a cassette.",

  "Учитавање касета...": "Loading cassettes...",

  "Радио драме тренутно није могуће учитати.":
    "Radio dramas couldn't be loaded right now.",

  "Још нема објављених радио драма.":
    "No radio dramas have been published yet.",

  "НЕПОЗНАТ АУТОР": "UNKNOWN AUTHOR",

  // SLANJE PREPORUKE

  "Ако мислиш да нешто вреди чути — остави га на полици.":
    "If you think something is worth hearing, leave it on the shelf.",

  "НЕ МОРАШ": "YOU DON'T",
  "ДА ОСТАВИШ": "HAVE TO LEAVE",
  "МЕЈЛ.": "AN EMAIL.",

  "САМО РЕЦИ": "JUST TELL ME",
  "ШТА ТИ СЕ": "WHAT YOU",
  "СВИЂА.": "LIKE.",

  "ШТА ШАЉЕШ?": "WHAT ARE YOU SENDING?",

  "НАЗИВ ПЕСМЕ": "SONG TITLE",
  "НАЗИВ ПЛЕЈЛИСТЕ": "PLAYLIST TITLE",
  "НАЗИВ РАДИО ДРАМЕ": "RADIO DRAMA TITLE",

  "АУТОР / КАНАЛ — ОПЦИОНО":
    "CREATOR / CHANNEL — OPTIONAL",

  "АУТОР / ПРОДУКЦИЈА — ОПЦИОНО":
    "AUTHOR / PRODUCTION — OPTIONAL",

  "ИЗВОЂАЧ — ОПЦИОНО": "ARTIST — OPTIONAL",

  "YOUTUBE PLAYLIST ЛИНК": "YOUTUBE PLAYLIST LINK",
  "YOUTUBE ЛИНК РАДИО ДРАМЕ":
    "RADIO DRAMA YOUTUBE LINK",
  "YOUTUBE ЛИНК ПЕСМЕ": "SONG YOUTUBE LINK",

  "Пошаљи линк целе YouTube плејлисте. Ако буде одобрена, пуштаће се директно на звучнику.":
    "Send the complete YouTube playlist link. Once approved, it'll play on the boombox.",

  "Пошаљи директан YouTube линк радио драме.":
    "Send a direct YouTube link to the radio drama.",

  "Пошаљи директан YouTube линк песме.":
    "Send a direct YouTube link to the song.",

  "Шта препоручујеш?": "What are you recommending?",
  "Ко стоји иза тога?": "Who's behind it?",

  "УЧИТАВАЊЕ...": "LOADING...",
  "ИЗАБЕРИ ЖАНР": "SELECT A GENRE",

  "ИМЕ ИЛИ НАДИМАК": "NAME OR NICKNAME",
  "Како да те потпишем?": "What should I call you?",

  "ЗАШТО ТИ СЕ ОВО СВИЂА?": "WHY DO YOU LIKE IT?",
  "Напиши свој утисак...": "Tell me what you think...",

  "ШАЉЕМ...": "SENDING...",
  "ПОШАЉИ ПРЕПОРУКУ →": "SEND RECOMMENDATION →",

  "Попуни назив, линк, име или надимак и зашто ти се ово свиђа.":
    "Fill in the title, link, name or nickname, and why you like it.",

  "Изабери жанр песме.": "Choose the song's genre.",

  "Жанрове тренутно није могуће учитати.":
    "Genres couldn't be loaded right now.",

  "Препоруку тренутно није могуће послати.":
    "Your recommendation couldn't be sent right now.",

  "ПРЕПОРУКА ЈЕ ПОСЛАТА. ХВАЛА.":
    "RECOMMENDATION SENT. THANK YOU.",

  // ANALIZE

  "ПРЕВОДИ / АНАЛИЗЕ": "TRANSLATIONS / ANALYSES",
  "СВЕСКЕ": "NOTEBOOKS",

  "Белешке, преводи и рашчлањивање песама.":
    "Notes, translations, and song breakdowns.",

  "Учитавање свезака...": "Loading notebooks...",

  "Анализе тренутно није могуће учитати.":
    "Analyses couldn't be loaded right now.",

  "Још нема објављених анализа.":
    "No analyses have been published yet.",

  "НА ПОЛИЦИ": "ON THE SHELF",
  "СЕКИЈЕВЕ БЕЛЕШКЕ": "SEKI'S NOTES",

  "ПРЕВОД + АНАЛИЗА": "TRANSLATION + ANALYSIS",
  "АНАЛИЗА": "ANALYSIS",

  "ОТВОРИ СВЕСКУ": "OPEN NOTEBOOK",
  "Отвори": "Open",
  "непознат извођач": "unknown artist",

  // POJEDINAČNE STRANICE

  "РАДОВИ": "WORKS",

  "Овај текст још није објављен.":
    "This text hasn't been published yet.",

  "Текст тренутно није могуће учитати.":
    "This text couldn't be loaded right now.",

  "Радио драму тренутно није могуће учитати.":
    "This radio drama couldn't be loaded right now.",

  "СЕКИ / РАДИО ДРАМЕ": "SEKI / RADIO DRAMAS",

  "Пусти": "Play",
  "на звучнику": "on the boombox",

  "ПУСТИ": "PLAY",
  "НА РАДИЈУ": "ON THE BOOMBOX",
  "ЗВУЧНИК →": "BOOMBOX →",

  "О РАДИО ДРАМИ": "ABOUT THE RADIO DRAMA",

  "За ову радио драму још није додат опис.":
    "No description has been added for this radio drama yet.",

  "ЗАШТО МИ СЕ СВИЂА": "WHY I LIKE IT",

  "ОРИГИНАЛ": "ORIGINAL",
  "ПРЕВОД": "TRANSLATION",

  "НАЗАД У ДРАМУ": "BACK TO RADIO DRAMA",
  "НАЗАД У РИДЕР": "BACK TO READER",
};

// Podržavamo i ranije izmenjeni HumanOneMusicGenres,
// ako je već koristio recommendationsLanding ključeve.

export const musicLandingLabels = {
  backToMusic: "← МУЗИКА",
  sectionLabel: "ПРЕПОРУКЕ / 01",
  title: "ШТА ТРАЖИШ?",
  subtitle: "Изабери полицу.",

  shelf01: "ПОЛИЦА 01",
  shelf02: "ПОЛИЦА 02",
  shelf03: "ПОЛИЦА 03",
  shelf04: "ПОЛИЦА 04",

  recordsTitle: "ДИСКОВИ",
  recordsDescription:
    "Појединачне препоруке. Претражуј по жанру, извођачу и години.",

  playlistsTitle: "ПЛЕЈЛИСТЕ",
  playlistsDescription:
    "Моји сетови песама, сложени као пластични балк дискова.",

  radioDramasTitle: "РАДИО ДРАМЕ",
  radioDramasDescription:
    "Приче за слушање, сложене као старе аудио касете.",

  noteLine1: "ТВОЈА",
  noteLine2: "ПРЕПОРУКА",

  submitTitleLine1: "ПОШАЉИ",
  submitTitleLine2: "ПРЕПОРУКУ",
  submitDescription:
    "Пошаљи ми песму, плејлисту или радио драму коју вреди чути.",

  openShelf: "ОТВОРИ ПОЛИЦУ →",
  submitAction: "ОСТАВИ ПРЕПОРУКУ →",
};

export const musicTranslations = en;

export function translateMusicText(value, language) {
  if (
    typeof value !== "string" ||
    language !== "en"
  ) {
    return value;
  }

  const key = value
    .replace(/\s+/g, " ")
    .trim();

  return Object.prototype.hasOwnProperty.call(
    en,
    key
  )
    ? en[key]
    : value;
}

export function useMusicTranslation() {
  const { language } = useLanguage();

  return useCallback(
    (value) =>
      translateMusicText(
        value,
        language
      ),
    [language]
  );
}