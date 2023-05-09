import puppeteer from "puppeteer";
import fs from "fs";

const saveToFile = (data) => {
  fs.writeFile("./data/jobs.json", JSON.stringify(data), "utf8", (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("scraping success");
    }
  });
};

let offerTab = [];

const getJobOffers = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(
    `https://www.welcometothejungle.com/fr/stacks?page=1&refinementList%5Btools.frontend%5D%5B%5D=React%20JS`,
    { waitUntil: "networkidle2" }
  );

  const max = await page.evaluate(() => {
    return Number(
      document.querySelector(
        "[data-testid='stacks-search-pagination'] li:nth-last-child(2)"
      ).innerText
    );
  });

  for (let i = 0; i < 1; i++) {
    await page.waitForSelector("#job-search-results");

    const offers = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          "#job-search-results .ais-Hits-list-item a"
        ),
      ].map((elem) => {
        return {
          name: elem.querySelector("h3").innerText,
          description: elem.querySelector("span:nth-child(2)").innerText,
          logo: elem.querySelector("header img").getAttribute("src"),
          link:
            "https://www.welcometothejungle.com" + elem.getAttribute("href"),
        };
      });
    });

    offerTab = [...offerTab, offers];

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click("[aria-label='Pagination'] li:nth-last-child(1) a"),
    ]);
  }

  offerTab = offerTab.concat.apply([], offerTab).flat();

  getMoreAboutOffers(0);

  await browser.close();
};

getJobOffers();

const getMoreAboutOffers = async (index) => {
  const browser = await puppeteer.launch({ headless: true });

  if (index < offerTab.length) {
    const page = await browser.newPage();

    await page.goto(offerTab[index].link, {
      waitUntil: "networkidle2",
    });

    const networks = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          "[data-testid='organization-content-block-social-networks'] a"
        ),
      ].map((elem) => {
        const key = elem.querySelector("i").getAttribute("name");
        const value = elem.getAttribute("href");
        console.log({ [key]: value });
        return JSON.stringify({ [key]: value });
      });
    });

    const website = await page.evaluate(() => {
      return document
        .querySelector("[data-testid='organization-cover-metas'] a")
        .getAttribute("href");
    });

    const city = await page.evaluate(() => {
      return document.querySelector(
        "[data-testid='organization-cover-metas'] li:nth-child(2) span:nth-child(2)"
      ).innerText;
    });

    offerTab[index] = { ...offerTab[index], website, city, networks };
    index++;
    getMoreAboutOffers(index);
  } else {
    saveToFile(offerTab);
    await browser.close();
  }
};
