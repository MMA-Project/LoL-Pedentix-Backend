// export const getAllLeaguePedantix = async (): Promise<void> => {
//   for (let i = 0; i < champions.length; i++) {
//     const champion = champions[i];
//     const url = `https://universe.leagueoflegends.com/fr_FR/story/champion/${champion}/`;

//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     await page.goto(url, {
//       waitUntil: "networkidle0",
//     });

//     const text = await page.$$eval(".p_1_sJ", (elements) =>
//       elements.map((el) => el.textContent?.trim()).join(" \n")
//     );

//     const image = await page.$eval(".image_3oOd", (el) => {
//       const style = el.getAttribute("style") || "";
//       const match = style.match(/url\(['"]?(.*?)['"]?\)/);
//       return match ? match[1] : "";
//     });

//     console.log(champion, image);
//     saveChampionToFile(new LeaguePedantix(champion, image, text));

//     await browser.close();
//   }
// };
//getAllLeaguePedantix();
