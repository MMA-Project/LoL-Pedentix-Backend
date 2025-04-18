import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

export interface LeaguePedantixModel {
  name: string;
  image: string;
  text: string;
}

export class LeaguePedantix implements LeaguePedantixModel {
  constructor(public name: string, public image: string, public text: string) {}
}

export const getLeaguePedantixfromSeed = async (
  seed: number
): Promise<LeaguePedantixModel> => {
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const name = champions[Math.floor(seededRandom(seed) * champions.length)];
  const url = `https://universe.leagueoflegends.com/fr_FR/story/champion/${name}/`;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const { data: html } = await axios.get<string>(url);
  const $ = cheerio.load(html);

  const text = await page.$$eval(".p_1_sJ", (elements) =>
    elements.map((el) => el.textContent?.trim()).join(" \n")
  );

  const image = await page.$eval(".image_3oOd", (el) => {
    const style = el.getAttribute("style") || "";
    const match = style.match(/url\(['"]?(.*?)['"]?\)/);
    return match ? match[1] : "";
  });

  return new LeaguePedantix(name, image, text);
};

export const champions = [
  "aatrox",
  "ahri",
  "akali",
  "akshan",
  "alistar",
  "amumu",
  "anivia",
  "annie",
  "aphelios",
  "ashe",
  "aurelionsol",
  "azir",
  "bard",
  "belveth",
  "blitzcrank",
  "brand",
  "braum",
  "briar",
  "caitlyn",
  "camille",
  "cassiopeia",
  "chogath",
  "corki",
  "darius",
  "diana",
  "draven",
  "ekko",
  "elise",
  "evelynn",
  "ezreal",
  "fiddlesticks",
  "fiora",
  "fizz",
  "galio",
  "gangplank",
  "garen",
  "gnar",
  "gragas",
  "graves",
  "gwen",
  "hecarim",
  "heimerdinger",
  "illaoi",
  "irelia",
  "ivern",
  "janna",
  "jarvaniv",
  "jax",
  "jayce",
  "jhin",
  "jinx",
  "kaisa",
  "kalista",
  "karma",
  "karthus",
  "kassadin",
  "katarina",
  "kayle",
  "kayn",
  "kennen",
  "khazix",
  "kindred",
  "kled",
  "kogmaw",
  "ksante",
  "leblanc",
  "lee-sin",
  "leona",
  "lillia",
  "lissandra",
  "lucian",
  "lulu",
  "lux",
  "malphite",
  "malzahar",
  "maokai",
  "masteryi",
  "milio",
  "missfortune",
  "mordekaiser",
  "morgana",
  "naafiri",
  "nami",
  "nasus",
  "nautilus",
  "neeko",
  "nidalee",
  "nilah",
  "nocturne",
  "nunu",
  "olaf",
  "orianna",
  "ornn",
  "pantheon",
  "poppy",
  "pyke",
  "qiyana",
  "quinn",
  "rakan",
  "rammus",
  "reksai",
  "rell",
  "renata",
  "renekton",
  "rengar",
  "riven",
  "rumble",
  "ryze",
  "samira",
  "sejuani",
  "senna",
  "seraphine",
  "sett",
  "shaco",
  "shen",
  "shyvana",
  "singed",
  "sion",
  "sivir",
  "skarner",
  "sona",
  "soraka",
  "swain",
  "sylas",
  "syndra",
  "tahmkench",
  "taliyah",
  "talon",
  "taric",
  "teemo",
  "thresh",
  "tristana",
  "trundle",
  "tryndamere",
  "twistedfate",
  "twitch",
  "udyr",
  "urgot",
  "varus",
  "vayne",
  "veigar",
  "velkoz",
  "vex",
  "vi",
  "viego",
  "viktor",
  "vladimir",
  "volibear",
  "warwick",
  "wukong",
  "xayah",
  "xerath",
  "xinzhao",
  "yasuo",
  "yone",
  "yorick",
  "yuumi",
  "zac",
  "zed",
  "zeri",
  "ziggs",
  "zilean",
  "zoe",
  "zyra",
  "mel",
  "ambessa",
];
